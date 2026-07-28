import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AudioWaveform from "@/components/AudioWaveform";

interface VoiceRequest {
  id: string;
  requester_id: string;
  topic: string;
  created_at: string;
  requester_username?: string;
}

interface RecordForRequestDialogProps {
  request: VoiceRequest | null;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecordForRequestDialog = ({
  request,
  userId,
  open,
  onOpenChange,
}: RecordForRequestDialogProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const data = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 12;
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

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setVisualizerData([]);
        stream.getTracks().forEach((track) => track.stop());
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch {}
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndFulfill = async () => {
    if (!audioBlob || !request || !userId) return;

    setUploading(true);
    try {
      const fileName = `${userId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(fileName);

      // Save voice message and get its ID
      const { data: voiceMessage, error: dbError } = await supabase
        .from("voice_messages")
        .insert({
          user_id: userId,
          audio_url: publicUrl,
          category: "general",
        })
        .select("id")
        .single();

      if (dbError) throw dbError;

      // Get the fulfiller's username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .single();

      // Create or find conversation between fulfiller and requester
      let conversationId: string;
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_one_id.eq.${userId},participant_two_id.eq.${request.requester_id}),and(participant_one_id.eq.${request.requester_id},participant_two_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingConvo) {
        conversationId = existingConvo.id;
      } else {
        const { data: newConvo, error: convoError } = await supabase
          .from("conversations")
          .insert({
            participant_one_id: userId,
            participant_two_id: request.requester_id,
            original_voice_message_id: voiceMessage.id,
          })
          .select("id")
          .single();
        if (convoError) throw convoError;
        conversationId = newConvo.id;
      }

      // Send the audio as a conversation message
      const { error: msgError } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: `Voice response to: "${request.topic}"`,
          audio_url: publicUrl,
          message_type: "voice",
        });
      if (msgError) throw msgError;

      // Create notification for the requester with the audio
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: request.requester_id,
          type: "request_fulfilled",
          message: `${profile?.username || "Someone"} recorded a voice message for your request: "${request.topic}"`,
          related_message_id: voiceMessage.id,
          from_user_id: userId,
        });

      if (notifError) throw notifError;

      // Delete the request since it's fulfilled
      const { error: deleteError } = await supabase
        .from("voice_message_requests")
        .delete()
        .eq("id", request.id);

      if (deleteError) throw deleteError;

      toast.success("Thank you for fulfilling this request! 🎉");
      handleClose();
    } catch (error: any) {
      toast.error("Failed to upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setAudioBlob(null);
    setIsRecording(false);
    setVisualizerData([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Record for Request
          </DialogTitle>
          <DialogDescription className="pt-2">
            {request && (
              <span className="italic text-foreground/80">
                "{request.topic}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              size="lg"
              className="w-24 h-24 rounded-full"
            >
              <Mic className="w-10 h-10" />
            </Button>
          )}

          {isRecording && (
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl" />
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="relative w-24 h-24 rounded-full hover:scale-105 transition-all duration-300 shadow-lg ring-4 ring-destructive/30 border-4 border-white/20"
                >
                  <Square className="w-10 h-10" />
                </Button>
              </div>
              <div className="w-full space-y-2">
                <div className="text-xs text-muted-foreground text-center">
                  Recording audio
                </div>
                <AudioWaveform data={visualizerData} className="w-full text-primary/80" />
              </div>
              <p className="text-sm text-destructive">
                Recording... Click stop when done
              </p>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-4 w-full">
              <div className="p-4 rounded-xl bg-muted">
                <audio
                  src={URL.createObjectURL(audioBlob)}
                  controls
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={uploadAndFulfill}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Share Message"}
                </Button>
                <Button
                  onClick={() => setAudioBlob(null)}
                  variant="outline"
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Discard
                </Button>
              </div>
            </div>
          )}

          {!isRecording && !audioBlob && (
            <p className="text-sm text-muted-foreground text-center">
              Click the mic to start recording your response
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordForRequestDialog;
