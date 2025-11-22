import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Square, Upload, Volume2, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { generateBackgroundMusic, mixAudioFiles } from "@/lib/backgroundMusic";

interface AudioRecorderProps {
  userId: string;
}

const AudioRecorder = ({ userId }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chosenMimeType, setChosenMimeType] = useState<string>("");
  const [fileExt, setFileExt] = useState<string>("webm");
  const [backgroundMusic, setBackgroundMusic] = useState<'none' | 'gentle-waves' | 'soft-hum' | 'peaceful-chimes' | 'nature-sounds'>('none');
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [mixingAudio, setMixingAudio] = useState(false);
  const [hasAudioActivity, setHasAudioActivity] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [meterLevel, setMeterLevel] = useState(0);

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
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMeterLevel(rms);
        
        // Track if there's meaningful audio activity (above threshold)
        if (rms > 0.02) {
          setHasAudioActivity(true);
        }
        
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(audioBlob);
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
            const bgMusicBlob = await generateBackgroundMusic(recordingDuration, backgroundMusic);
            if (bgMusicBlob) {
              const mixed = await mixAudioFiles(audioBlob, bgMusicBlob, 1.0, 0.25);
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

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setHasAudioActivity(false); // Reset audio activity tracking
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

    // Check if there was any audio activity during recording
    if (!hasAudioActivity) {
      toast.error("No speech detected in your recording. Please speak into the microphone.");
      return;
    }

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
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              Background Music
            </label>
            <Select value={backgroundMusic} onValueChange={(v: any) => setBackgroundMusic(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select background music" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="gentle-waves">Gentle Waves</SelectItem>
                <SelectItem value="soft-hum">Soft Hum</SelectItem>
                <SelectItem value="peaceful-chimes">Peaceful Chimes</SelectItem>
                <SelectItem value="nature-sounds">Nature Sounds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-4 py-6">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              size="lg"
              className="w-32 h-32 rounded-full bg-gradient-warm hover:scale-110 transition-all shadow-glow"
            >
              <Mic className="w-12 h-12" />
            </Button>
          )}

          {isRecording && (
            <div className="w-full flex flex-col items-center gap-4">
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-32 h-32 rounded-full bg-destructive hover:scale-110 transition-all shadow-glow animate-pulse"
              >
                <Square className="w-12 h-12" />
              </Button>
              <div className="w-full">
                <div className="text-xs text-muted-foreground mb-2 text-center">Input level</div>
                <Progress value={Math.min(100, Math.max(0, Math.round(meterLevel * 100)))} className="h-2 rounded-full" />
              </div>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-4 w-full">
              {mixingAudio ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Adding background music...</div>
                </div>
              ) : (
                <audio src={previewBlob ? URL.createObjectURL(previewBlob) : URL.createObjectURL(audioBlob)} controls className="w-full rounded-xl" />
              )}
              <div className="flex gap-3">
                <Button
                  onClick={uploadRecording}
                  disabled={uploading || mixingAudio}
                  className="flex-1 bg-gradient-warm hover:opacity-90 rounded-xl shadow-soft"
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
                  className="rounded-xl"
                  disabled={mixingAudio}
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
    </Card>
  );
};

export default AudioRecorder;
