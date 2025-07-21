import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import WaveformVisualizer from './WaveFormVisualizer';
import { useAuth } from '../context/AuthContext';
import { DotLoader } from './DotLoader';

const MAX_RECORDING_TIME = 180000; // 3 minutes in ms

export default function VoiceCaptureButton({ setState }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const timerRef = useRef(null);
  const [liveStream, setLiveStream] = useState(null);
  const {token} = useAuth()
  const [isTranscribing, setIsTranscribing] = useState(false);


  useEffect(() => {
    if (!isRecording) return;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setLiveStream(stream);
        setMediaRecorder(recorder);
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          handleTranscription(new Blob(chunks, { type: 'audio/webm' }));
        };

        recorder.start();
        setAudioChunks(chunks);

        timerRef.current = setTimeout(() => {
          recorder.stop();
          setIsRecording(false);
        }, MAX_RECORDING_TIME);
      })
      .catch((err) => {
        console.error("Error accessing mic:", err);
        setIsRecording(false);
      });

    return () => clearTimeout(timerRef.current);
  }, [isRecording]);

  const handleTranscription = async (audioBlob) => {
  try {
    setIsTranscribing(true); // ⬅️ start loading
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error('Transcription failed');

    const data = await res.json();
    setState(data.text);
  } catch (err) {
    console.error('Transcription error:', err);
    setState('[Transcription failed]');
  } finally {
    setIsTranscribing(false); // ⬅️ end loading
  }
};




  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    clearTimeout(timerRef.current);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setIsRecording(true);
    }
  };

  return (
    <button
        type="button"
      onClick={toggleRecording}
      className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition duration-300 ${
        isRecording ? 'bg-accent-destructive hover:bg-accent-destructivehover animate-pulse' : 'bg-accent-primary hover:bg-accent-primaryhover'
      }`}
    >
      {isRecording ? (
        <WaveformVisualizer stream={liveStream} />
        ) : isTranscribing ? (
        <DotLoader />
        ) : (
        <Mic color="white" size={20} />
        )}

    </button>
  );
}


