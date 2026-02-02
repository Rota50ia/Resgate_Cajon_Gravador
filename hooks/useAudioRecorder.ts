
import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      // CONFIGURAÇÃO PRO AUDIO: Desativar filtros que matam a dinâmica do Cajón
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // CRÍTICO: Não cancelar eco (isso abafa o instrumento)
          noiseSuppression: false,  // CRÍTICO: Não suprimir ruído (isso confunde o cajón com ruído)
          autoGainControl: false,   // CRÍTICO: Não mexer no ganho automaticamente
          channelCount: 1,
          sampleRate: 48000
        } 
      });

      // Preferência por formatos mais modernos e menos compressão
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // Maior intervalo para menos processamento em background
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Acesso ao microfone necessário!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  return {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording
  };
};
