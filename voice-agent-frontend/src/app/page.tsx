"use client";
import { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Activity, Edit, Play, Volume2, MessageSquare, RefreshCw, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';

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
  const [chatMessage, setChatMessage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('pNInz6obpgDQGcFmaJgB');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateAudio, setAutoGenerateAudio] = useState<boolean>(true);
  const [isCreatingThread, setIsCreatingThread] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{userMessage: string, agentMessage: string}[]>([]);

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
    createNewThread();
  }, []);

  // Effect to generate audio after agent replies
  useEffect(() => {
    if (text && hasAgentReplied && !isGenerating) {
      handleGenerateAudio();
    }
  }, [hasAgentReplied]);

  const createNewThread = () => {
    setIsCreatingThread(true);
    
    // Clear all conversation data
    setTranscript('');
    setChatMessage('');
    setText('');
    setAudioBlob(null);
    setAudioURL(null);
    setAudioElement(null);
    setHasAgentReplied(false);
    setError(null);
    
    // Generate new thread ID
    const newThreadId = uuidv4();
    console.log("Created new thread:", newThreadId);
    setThreadId(newThreadId);
    
    // Archive previous conversation if exists
    if (transcript && chatMessage) {
      setConversationHistory(prev => [
        ...prev, 
        {
          userMessage: transcript,
          agentMessage: chatMessage
        }
      ]);
    }
    
    setIsCreatingThread(false);
  };

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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <header className="w-full max-w-xl flex items-center justify-between py-6">
        <h1 className="text-3xl font-bold text-indigo-800">QuickTask Agent</h1>
        <button
          onClick={createNewThread}
          disabled={isCreatingThread || isRecording}
          className="flex items-center px-4 py-2 bg-white border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Thread
          {isCreatingThread && <RefreshCw className="w-3 h-3 ml-2 animate-spin" />}
        </button>
      </header>
      
      <p className="text-gray-600 text-sm mb-8 w-full max-w-xl">
        Your voice-powered AI assistant • Thread ID: {threadId?.substring(0, 8)}...
      </p>
      
      <main className="w-full max-w-xl flex flex-col items-center space-y-6">
        {/* Main recording control */}
        <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 flex flex-col items-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative p-6 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-100 hover:bg-red-200 shadow-md' 
                  : 'bg-indigo-100 hover:bg-indigo-200 shadow-md'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              disabled={isTranscribing || isGenerating || isCreatingThread}
            >
              {isRecording ? (
                <StopCircle className="w-16 h-16 text-red-600" />
              ) : (
                <Mic className={`w-16 h-16 text-indigo-600 ${isRecording ? 'animate-pulse' : ''}`} />
              )}
              
              {isRecording && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-medium p-1 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                  {recordingTime < 60 ? recordingTime : '59+'}
                </span>
              )}
            </button>
            
            {isRecording && (
              <div className="mt-4 flex items-center px-4 py-2 bg-red-50 rounded-full">
                <Activity className="w-4 h-4 text-red-500 animate-pulse mr-2" />
                <span className="text-red-600 font-medium">{formatTime(recordingTime)}</span>
              </div>
            )}

            <div className="w-full mt-6 text-center">
              <span className="text-gray-500 text-sm">
                {isRecording 
                  ? "Recording in progress... tap to stop" 
                  : isTranscribing 
                    ? "Processing your audio..." 
                    : "Tap the microphone to speak"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Status indicators */}
        {isGenerating && (
          <div className="w-full flex items-center justify-center space-x-2 bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">Generating audio response...</span>
          </div>
        )}
        
        {isCreatingThread && (
          <div className="w-full flex items-center justify-center space-x-2 bg-indigo-50 p-3 rounded-xl shadow-sm border border-indigo-100">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-indigo-700 font-medium">Creating new conversation...</span>
          </div>
        )}
        
        {isPlaying && audioElement && (
          <div className="w-full flex items-center justify-center space-x-2 bg-green-50 p-3 rounded-xl shadow-sm border border-green-100">
            <Volume2 className="h-5 w-5 text-green-600 animate-pulse" />
            <span className="text-green-700 font-medium">Playing audio response...</span>
          </div>
        )}
        
        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-sm">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Current Conversation */}
        <div className="w-full space-y-4">
          {/* Transcript */}
          {(transcript || isTranscribing) && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center">
                <MessageSquare className="w-5 h-5 text-indigo-700 mr-2" />
                <h2 className="text-lg font-semibold text-indigo-900">You</h2>
              </div>
              <div className="p-5">
                {isTranscribing ? (
                  <div className="flex items-center justify-center py-8 space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span className="text-gray-600">Processing your audio...</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
                    {transcript && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            const newText = window.prompt("Edit:", transcript);
                            if (newText !== null) {
                              setTranscript(newText);
                            }
                          }}
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit Transcript
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Agent Reply */}
          {(hasAgentReplied || isGenerating) && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <h2 className="text-lg font-semibold text-blue-900">Agent</h2>
                </div>
                {hasAgentReplied && audioElement && (
                  <button 
                    onClick={() => {
                      if (audioElement) {
                        audioElement.currentTime = 0;
                        audioElement.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="flex items-center text-xs text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    title="Play audio again"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-5">
                {!hasAgentReplied ? (
                  <div className="flex items-center justify-center py-8 space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Getting response...</span>
                  </div>
                ) : (
                  <div className="prose prose-blue max-w-none">
                    <ReactMarkdown>{chatMessage}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Previous Conversations */}
        {conversationHistory.length > 0 && (
          <div className="w-full mt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Previous Conversations</h3>
            <div className="space-y-4">
              {conversationHistory.map((conv, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs font-medium text-indigo-800">Y</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm line-clamp-2">{conv.userMessage}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 mt-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs font-medium text-blue-800">A</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm line-clamp-2">{conv.agentMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Submit button - shown only if auto-generate is off */}
        {transcript && !isTranscribing && !isRecording && !autoGenerateAudio && (
          <div className="w-full">
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !transcript.trim()}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                isGenerating || !transcript.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
              }`}
            >
              {isGenerating ? 'Processing...' : 'Submit'}
            </button>
          </div>
        )}
      </main>
      
      <footer className="mt-10 py-4 text-center text-gray-500 text-sm">
        <p>© 2025 QuickTask Agent</p>
      </footer>
    </div>
  );
}