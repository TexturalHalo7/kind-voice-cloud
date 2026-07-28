import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Square, Upload, Music, Tag, RefreshCw, Lightbulb, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AudioWaveform from "@/components/AudioWaveform";
import { generateBackgroundMusic, mixAudioFiles, preloadBackgroundAudio, BackgroundSoundType, SOUND_LABELS } from "@/lib/backgroundMusic";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PROMPT_IDEAS = [
  "Tell someone they matter — just as they are.",
  "Share a small moment of kindness that made your day.",
  "Remind a stranger that tough seasons don't last forever.",
  "Say thank you to someone you've never met.",
  "Send encouragement to someone who is doubting themselves.",
  "Share one thing you're grateful for right now.",
  "Tell someone their existence is a gift to the world.",
  "Offer a gentle reminder to take a deep breath.",
  "Share a lesson that helped you get through a hard time.",
  "Simply say: 'I'm proud of you for showing up today.'",
];

interface AudioRecorderProps {
  userId: string;
}

type MessageCategory = "general" | "encouragement" | "gratitude" | "motivation";

const AudioRecorder = ({ userId }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chosenMimeType, setChosenMimeType] = useState<string>("");
  const [fileExt, setFileExt] = useState<string>("webm");
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundSoundType>('none');
  const [category, setCategory] = useState<MessageCategory>("general");
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [mixingAudio, setMixingAudio] = useState(false);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPT_IDEAS.length));
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const pendingStartRef = useRef(false);
  const preloadedBgRef = useRef<AudioBuffer | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>([]);

  const PLEDGE_KEY = "vok_pledge_ack";

  const handleMicClick = () => {
    const ack = typeof window !== "undefined" ? localStorage.getItem(PLEDGE_KEY) : "1";
    if (!ack) {
      pendingStartRef.current = true;
      setPledgeOpen(true);
      return;
    }
    startRecording();
  };

  const acknowledgePledge = () => {
    try { localStorage.setItem(PLEDGE_KEY, "1"); } catch {}
    setPledgeOpen(false);
    if (pendingStartRef.current) {
      pendingStartRef.current = false;
      startRecording();
    }
  };

  const nextPrompt = () => {
    setPromptIndex((i) => (i + 1) % PROMPT_IDEAS.length);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const track = stream.getAudioTracks()[0];
      if (!track) {
        toast.error("No microphone detected.");
        return;
      }
      track.enabled = true;
      // Safari may expose `muted` on MediaStreamTrack
      if (track.muted) {
        toast.warning("Your mic seems muted at system level. Check input settings.");
      }

      // Setup input level meter
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 16;
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / barCount);
        const values: number[] = [];
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += data[i * step + j];
          }
          values.push(step ? Math.floor(sum / step) : 0);
        }
        setVisualizerData(values);
        rafIdRef.current = requestAnimationFrame(loop);
      };
      loop();

      const preferredTypes = [
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      let selectedType = "";
      const isSupported = (MediaRecorder as any).isTypeSupported?.bind(MediaRecorder);
      for (const t of preferredTypes) {
        if (isSupported?.(t)) { selectedType = t; break; }
      }

      const options: MediaRecorderOptions | undefined = selectedType ? { mimeType: selectedType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const finalType = selectedType || mediaRecorder.mimeType || "audio/webm";
      setChosenMimeType(finalType);
      setFileExt(finalType.includes("mp4") ? "m4a" : finalType.includes("ogg") ? "ogg" : "webm");

      mediaRecorder.ondataavailable = (event) => {
        console.log("Audio data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Recording error occurred. Please try again.");
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(audioBlob);
        setVisualizerData([]);
        stream.getTracks().forEach((track) => track.stop());
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        try { analyserRef.current?.disconnect(); sourceRef.current?.disconnect(); } catch {}
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch {}
          audioCtxRef.current = null;
        }

        // Mix with background music immediately for preview
        if (backgroundMusic !== 'none') {
          setMixingAudio(true);
          try {
            const recordingDuration = (Date.now() - recordingStartTime) / 1000;
            const bgMusicBlob = await generateBackgroundMusic(recordingDuration, backgroundMusic, preloadedBgRef.current);
            if (bgMusicBlob) {
              const bgVolume = backgroundMusic === 'night-crickets' ? 0.25
                : ['soft-rain', 'brown-noise', 'ocean-waves'].includes(backgroundMusic) ? 0.13
                : 0.20;
              const mixed = await mixAudioFiles(audioBlob, bgMusicBlob, 1.0, bgVolume);
              setPreviewBlob(mixed);
            } else {
              setPreviewBlob(audioBlob);
            }
          } catch (error) {
            toast.error("Failed to add background music");
            setPreviewBlob(audioBlob);
          } finally {
            setMixingAudio(false);
          }
        } else {
          setPreviewBlob(audioBlob);
        }
      };

      // Start recording with timeslice to collect data every second
      mediaRecorder.start(1000);
      console.log("MediaRecorder started, state:", mediaRecorder.state);
      setIsRecording(true);
      setRecordingStartTime(Date.now());

      // Pre-load background audio in parallel while user records
      if (backgroundMusic !== 'none') {
        preloadBackgroundAudio(backgroundMusic).then(buf => {
          preloadedBgRef.current = buf;
        });
      }
      
      toast.info("Recording started! Speak from your heart 💖");
    } catch (error) {
      toast.error("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (backgroundMusic !== 'none') {
        toast.info("Processing audio with background music...");
      } else {
        toast.success("Recording complete! Ready to share your message.");
      }
    }
  };

  const uploadRecording = async () => {
    if (!userId) return;
    
    // Use the preview blob (already mixed) or the original audio blob
    const finalBlob = previewBlob || audioBlob;
    if (!finalBlob) return;

    setUploading(true);

    try {
      toast.info("Uploading your message...");
      
      const fileName = `${userId}-${Date.now()}.wav`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, finalBlob, {
          contentType: "audio/wav",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("voice_messages")
        .insert({
          user_id: userId,
          audio_url: publicUrl,
          category: category,
        });

      if (dbError) throw dbError;

      toast.success("Your message of kindness has been shared! 🎉");
      setAudioBlob(null);
      setPreviewBlob(null);
    } catch (error: any) {
      toast.error("Failed to upload message: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm animate-in fade-in slide-in-from-left duration-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Record Your Message
        </CardTitle>
        <CardDescription>
          Share a kind word, encouragement, or gratitude
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRecording && !audioBlob && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Message Category
              </label>
              <Select value={category} onValueChange={(v: MessageCategory) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="general">General Positivity</SelectItem>
                  <SelectItem value="encouragement">Encouragement</SelectItem>
                  <SelectItem value="gratitude">Gratitude</SelectItem>
                  <SelectItem value="motivation">Motivation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                Background Sound
              </label>
              <Select value={backgroundMusic} onValueChange={(v: BackgroundSoundType) => setBackgroundMusic(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select background sound" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-60">
                  {(Object.entries(SOUND_LABELS) as [BackgroundSoundType, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        <div className="flex flex-col items-center gap-4 py-6">
          {!isRecording && !audioBlob && (
            <>
              <div className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Lightbulb className="w-4 h-4" />
                    Need an idea?
                  </div>
                  <button
                    type="button"
                    onClick={nextPrompt}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    New prompt
                  </button>
                </div>
                <p className="text-sm text-foreground/90 italic">"{PROMPT_IDEAS[promptIndex]}"</p>
              </div>
              <Button
                onClick={handleMicClick}
                size="lg"
                className="w-32 h-32 rounded-full bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Mic className="w-12 h-12 text-primary-foreground" />
              </Button>
            </>
          )}

          {isRecording && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl" />
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="relative w-36 h-36 rounded-full bg-destructive hover:bg-destructive/90 hover:scale-105 transition-all duration-300 shadow-lg ring-4 ring-destructive/30 border-4 border-white/20"
                >
                  <Square className="w-12 h-12 drop-shadow-lg relative z-10" />
                </Button>
              </div>
              <div className="w-full space-y-2">
                <div className="text-xs text-muted-foreground text-center">Recording audio</div>
                <AudioWaveform data={visualizerData} className="w-full text-primary/80" />
              </div>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-5 w-full">
              {mixingAudio ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div className="text-sm text-muted-foreground">Adding background music...</div>
                </div>
              ) : (
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-primary/10 shadow-lg">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Mic className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">Your Recording</div>
                      <audio 
                        src={previewBlob ? URL.createObjectURL(previewBlob) : URL.createObjectURL(audioBlob)} 
                        controls 
                        className="w-full h-10 rounded-lg [&::-webkit-media-controls-panel]:bg-background/80 [&::-webkit-media-controls-panel]:rounded-lg" 
                      />
                    </div>
                  </div>
                  {backgroundMusic !== 'none' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Music className="w-3 h-3" />
                      <span>Enhanced with {backgroundMusic.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={uploadRecording}
                  disabled={uploading || mixingAudio}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Share This Message"}
                </Button>
                <Button
                  onClick={() => {
                    setAudioBlob(null);
                    setPreviewBlob(null);
                  }}
                  variant="outline"
                  className="rounded-xl border-2 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300"
                  disabled={mixingAudio || uploading}
                >
                  Discard
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {isRecording
              ? "🔴 Recording... Click stop when done"
              : audioBlob
              ? mixingAudio
                ? "Processing your audio..."
                : backgroundMusic !== 'none'
                ? "Listen to your message with background music!"
                : "Listen to your message and share it!"
              : "Click the mic to start recording"}
          </p>
        </div>
      </CardContent>

      <AlertDialog open={pledgeOpen} onOpenChange={setPledgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
              Before you begin...
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-foreground/90">
                <p>Your voice has the opportunity to change someone's whole day.</p>
                <p>A few kind words can comfort, encourage, or inspire someone who really needs them.</p>
                <p className="font-medium text-primary">Thank you for choosing kindness. ❤️</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={acknowledgePledge} className="bg-primary hover:bg-primary/90">
              I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AudioRecorder;
