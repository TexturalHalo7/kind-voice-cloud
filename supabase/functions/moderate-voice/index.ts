import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Starting transcription...');

    // Process audio in chunks and transcribe
    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI transcription error:', errorText);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcript = transcriptionResult.text.trim();

    console.log('Transcript:', transcript);

    // Check if transcript is empty or too short
    if (!transcript || transcript.length < 5) {
      return new Response(
        JSON.stringify({ 
          isAppropriate: false, 
          reason: 'No meaningful speech detected. Please speak clearly into the microphone.',
          transcript: transcript
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting content moderation with Lovable AI...');

    // Use Lovable AI (free with Cloud) to check for negative content
    const moderationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for a kindness and positivity platform. Analyze the following text and determine if it contains:
- Hate speech or discrimination
- Threats or violence
- Profanity or offensive language
- Negativity, complaints, or criticism
- Any content that doesn't promote kindness, encouragement, or gratitude

Respond with ONLY "APPROPRIATE" if the message is positive, kind, encouraging, or grateful.
Respond with ONLY "INAPPROPRIATE" if the message contains any negative, harmful, or unkind content.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
      }),
    });

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();
      console.error('Lovable AI moderation error:', errorText);
      throw new Error(`Moderation failed: ${errorText}`);
    }

    const moderationResult = await moderationResponse.json();
    const decision = moderationResult.choices[0].message.content.trim().toUpperCase();

    console.log('Moderation decision:', decision);

    const isAppropriate = decision === 'APPROPRIATE';

    return new Response(
      JSON.stringify({ 
        isAppropriate,
        reason: isAppropriate 
          ? 'Message approved!' 
          : 'Your message contains content that doesn\'t align with our kindness policy. Please share positive, encouraging, or grateful words.',
        transcript
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moderate-voice function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
