import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [meterLevel, setMeterLevel] = useState(0);
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
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMeterLevel(rms);
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

      // Save voice message
      const { error: dbError } = await supabase
        .from("voice_messages")
        .insert({
          user_id: userId,
          audio_url: publicUrl,
          category: "general",
        });

      if (dbError) throw dbError;

      // Mark request as fulfilled
      const { error: updateError } = await supabase
        .from("voice_message_requests")
        .update({
          is_fulfilled: true,
          fulfilled_by: userId,
          fulfilled_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

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
    setMeterLevel(0);
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
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/60 animate-ping" />
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="relative w-24 h-24 rounded-full"
                >
                  <Square className="w-10 h-10" />
                </Button>
              </div>
              <div className="w-full">
                <div className="text-xs text-muted-foreground mb-1 text-center">
                  Input level
                </div>
                <Progress
                  value={Math.min(100, Math.round(meterLevel * 100))}
                  className="h-2"
                />
              </div>
              <p className="text-sm text-destructive animate-pulse">
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
