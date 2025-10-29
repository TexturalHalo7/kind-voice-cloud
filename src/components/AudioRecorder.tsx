import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AudioRecorderProps {
  userId: string;
}

const AudioRecorder = ({ userId }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started! Speak from your heart 💖");
    } catch (error) {
      toast.error("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording complete! Ready to share your message.");
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob || !userId) return;

    setUploading(true);

    try {
      const fileName = `${userId}-${Date.now()}.webm`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
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
            <Button
              onClick={stopRecording}
              size="lg"
              className="w-32 h-32 rounded-full bg-destructive hover:scale-110 transition-all shadow-glow animate-pulse"
            >
              <Square className="w-12 h-12" />
            </Button>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-4 w-full">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full rounded-xl" />
              <div className="flex gap-3">
                <Button
                  onClick={uploadRecording}
                  disabled={uploading}
                  className="flex-1 bg-gradient-warm hover:opacity-90 rounded-xl shadow-soft"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Share This Message"}
                </Button>
                <Button
                  onClick={() => setAudioBlob(null)}
                  variant="outline"
                  className="rounded-xl"
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
              ? "Listen to your message and share it!"
              : "Click the mic to start recording"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
