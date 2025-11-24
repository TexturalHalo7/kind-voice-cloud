import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Transcript received:', transcript);

    // Check if transcript is empty or too short
    if (transcript.length < 5) {
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
