// File: app/api/transcribe/route.js
import { NextResponse } from 'next/server';

export async function POST(request: any) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file');
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Get your OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Convert FormData file to Blob, then to File to send to OpenAI
    const buffer = await audioFile.arrayBuffer();
    const blob = new Blob([buffer]);
    
    // Create new form data for the OpenAI API request
    const openAiFormData = new FormData();
    openAiFormData.append('file', blob, 'audio.wav');
    openAiFormData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Error transcribing audio', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}