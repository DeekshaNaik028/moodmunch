import React, { useState } from 'react';
import { Mic, PlayCircle, StopCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../common/Button';

export const VoiceInput = ({ onIngredientsExtracted }) => {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });

        setLoading(true);
        try {
          const result = await api.ingredients.extractFromAudio(file);
          onIngredientsExtracted(result.ingredients);
        } catch (err) {
          alert(err.message);
        } finally {
          setLoading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="gradient-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-5 h-5 text-pink-600 dark:text-pink-400" />
        <h3 className="font-semibold text-gray-800 dark:text-white">Voice Input</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Say your ingredients out loud
      </p>
      <Button
        onClick={recording ? stopRecording : startRecording}
        disabled={loading}
        variant={recording ? 'secondary' : 'primary'}
        icon={recording ? StopCircle : PlayCircle}
        className="w-full"
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </Button>
    </div>
  );
};
