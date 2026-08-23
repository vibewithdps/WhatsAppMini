import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioLevels, setAudioLevels] = useState([20, 45, 80, 50, 30]);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analyserRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for real-time waveform bars
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Waveform update loop
      const updateWaveform = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          const sampleLevels = [
            Math.max(15, (dataArray[1] / 255) * 100),
            Math.max(25, (dataArray[3] / 255) * 100),
            Math.max(35, (dataArray[5] / 255) * 100),
            Math.max(20, (dataArray[7] / 255) * 100),
            Math.max(15, (dataArray[9] / 255) * 100),
          ];
          setAudioLevels(sampleLevels);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    clearInterval(timerIntervalRef.current);
    cancelAnimationFrame(animationFrameRef.current);
    setIsRecording(false);
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    setAudioBlob,
  };
};
