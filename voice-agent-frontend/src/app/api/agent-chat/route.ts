// File: app/api/transcribe/route.js
import { NextResponse } from 'next/server';

export async function POST(request: Request) {  
    try{
    const body = await request.json();
    console.log(body)
    const jsonBody = {
        input: {
            messages: [
                {
                    type: 'human',
                    content: body.content,
                }
            ]
        },
        config: {
            configurable: {
                langgraph_user_id: "Audio-TX-User",
                thread_id: body.threadId
             },
            }
        }

    const response = await fetch('http://127.0.0.1:8000/chat/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('FastAPI error:', errorData);
      return NextResponse.json(
        { error: 'Error retrieving chat reply from agent', details: errorData },
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