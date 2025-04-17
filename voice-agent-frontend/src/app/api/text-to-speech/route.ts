import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try{
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.log('ElevenLabs API key not configured');
        return NextResponse.json(
          { error: 'ElevenLabs API key not configured' },
          { status: 500 }
        );
      }
      const { text, voice} = await request.json();
      if(!text || !voice) {
        return NextResponse.json(
          { error: 'No text or voice provided' },
          { status: 400 }
        );
      }
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 1,
            similarity_boost: 0.75
          }
        }),
      });
      if(!response.ok){
        const errorData = await response.json().catch(() => ({}));
        console.error('ElevenLabs API error:', errorData);
        return NextResponse.json(
          { error: 'Error generating audio', details: errorData },
          { status: response.status }
        );
      }
      console.log('Audio generated successfully');
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      return NextResponse.json({ audio: audioBase64 });
    }catch (error: any) {
      console.error('Text-Speech Generation error:', error);
      const errorMessage = 
      typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : error.message || 'Failed to generate speech';
      return NextResponse.json(
        { error: errorMessage},
        { status: 500 }
      );
    }
  }