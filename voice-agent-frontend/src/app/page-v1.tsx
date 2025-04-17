"use client";
import { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Activity } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
export default function Home() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [hasAgentReplied, setHasAgentReplied] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [chatMessage, setChatMessage]  = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('pNInz6obpgDQGcFmaJgB');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateAudio, setAutoGenerateAudio] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      // Clean up any active streams on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioURL]);

  useEffect(() => {
    const threadId = uuidv4()
    console.log(threadId)
    setThreadId(threadId);
  }, []);

  // Effect to generate audio after agent replies
  useEffect(() => {
    if (text && hasAgentReplied && !isGenerating) {
      handleGenerateAudio();
    }
  }, [hasAgentReplied]);

  const handleGenerateAudio = async () => {
    if(!text.trim()){
      return;
    }
    
    setIsGenerating(true);

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
        }),
      });
      
      const data = await response.json();
      if(!response.ok){
        throw new Error(data.error || 'Error generating audio');
      }
      
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      setAudioElement(audio);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Error generating audio:', error);
      setError(error.message || 'Error generating audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const getLastMessage = (data: any) => {
    // Access the messages array
      const messages = data.output.messages;

      // Get the last message object
      const lastMessage = messages[messages.length - 1];

      // Extract the content from the last message
      const lastMessageContent = lastMessage.content;
      return lastMessageContent
  }
  
  const chatWithAgent = async (message: string) => {
    console.log(message)
    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message, threadId : threadId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      message = getLastMessage(data);
      setChatMessage(message);
      setText(message);
      setHasAgentReplied(true);
      // Audio will be generated automatically via the useEffect
    }catch(error: any) {
      console.error('Error chatting with agent:', error);
      setError('Error chatting with agent. Please try again.');
    }
  }

  const startRecording = async () => {
    try {
      // Clear any previous recording data
      setAudioBlob(null);
      setTranscript('');
      setError(null);
      setHasAgentReplied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks from the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track: any)=> track.stop());
        }
        
        // Transcribe the audio immediately after the blob is created
        const message = await transcribeRecordedAudio(audioBlob);
        if(message && autoGenerateAudio){
          await chatWithAgent(message);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev: any) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // The actual transcription will happen in the mediaRecorder.onstop handler
    }
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscript('');

    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.text);
      setTranscript(data.text);
      return data.text;
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      setError('Error transcribing audio. Please try again.');
      setTranscript(''); // Clear any previous transcript in case of error
    } finally {
      setIsTranscribing(false);
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };
  
  const handleSubmit = async () => {
    // Use the edited transcript to chat with the agent
    if (transcript.trim()) {
      setHasAgentReplied(false); // Reset agent reply state
      await chatWithAgent(transcript);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">QuickTask Agent</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative p-4 rounded-full transition-all duration-300 ${
              isRecording ? 'bg-red-100 hover:bg-red-200' : 'bg-blue-100 hover:bg-blue-200'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            disabled={isTranscribing || isGenerating}
          >
            {isRecording ? (
              <StopCircle className="w-12 h-12 text-red-600" />
            ) : (
              <Mic className={`w-12 h-12 text-blue-600 ${isRecording ? 'animate-pulse' : ''}`} />
            )}
            
            {isRecording && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center">
                {recordingTime < 60 ? recordingTime : '59+'}
              </span>
            )}
          </button>
          
          {isRecording && (
            <div className="mt-4 flex items-center">
              <Activity className="w-5 h-5 text-red-500 animate-pulse mr-2" />
              <span className="text-red-500 font-medium">Recording... {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-center">
          <input 
            type="checkbox" 
            id="autoGenerateAudio" 
            checked={autoGenerateAudio} 
            onChange={(e) => setAutoGenerateAudio(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="autoGenerateAudio" className="text-sm text-gray-700">
            Automatically submit after transcription
          </label>
        </div>
        
        {/* Submit button - shown only if auto-generate is off */}
        {transcript && !isTranscribing && !isRecording && !autoGenerateAudio && (
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !transcript.trim()}
              className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                isGenerating || !transcript.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isGenerating ? 'Processing...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
      
      {/* Status indicators */}
      {isGenerating && (
        <div className="mt-4 flex items-center justify-center space-x-2 bg-blue-50 p-2 rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-blue-600">Generating audio...</span>
        </div>
      )}
      
      {(transcript || isTranscribing) && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">You</h2>
          {isTranscribing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <span className="text-gray-600">Processing your audio...</span>
            </div>
          ) : (
            <div>
              <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
              {transcript && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const newText = window.prompt("Edit:", transcript);
                      if (newText !== null) {
                        setTranscript(newText);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit Transcript
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {(hasAgentReplied || isGenerating) && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Agent</h2>
          {!hasAgentReplied ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <span className="text-gray-600">Getting response...</span>
            </div>
          ) : (
            <div>
              <p className="text-gray-800 whitespace-pre-wrap">{chatMessage}</p>
            </div>
          )}
        </div>
      )}
      
      {isPlaying && audioElement && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Playing audio response...
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}