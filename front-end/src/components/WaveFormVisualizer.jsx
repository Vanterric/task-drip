import { useEffect, useRef, useState } from "react";

export default function WaveformVisualizer({ stream }) {
  const [barHeights, setBarHeights] = useState([10, 10, 10, 10, 10]);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioContextRef = useRef(null);
  const GROWTH_MULTIPLIER = 2;

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    const updateBars = () => {
      analyser.getByteTimeDomainData(dataArray);

      // Average the waveform values
      const average = dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) / bufferLength;

      // Normalize and create bar heights (just visual noise for now)
      const intensity = Math.min(average / 128, 1); // 0 to 1
      const newHeights = Array.from({ length: 5 }, () =>
        6 + Math.random() * 24 * intensity * (GROWTH_MULTIPLIER)
      );
      setBarHeights(newHeights);

      animationRef.current = requestAnimationFrame(updateBars);
    };

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    updateBars();

    return () => {
      cancelAnimationFrame(animationRef.current);
      analyser.disconnect();
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return (
  <div className="flex items-center justify-center gap-[3px] h-8">
    {barHeights.map((h, i) => (
      <div
        key={i}
        className="w-[4px] bg-white rounded-full transition-all duration-[80ms]"
        style={{
          height: `${h}px`,
        }}
      />
    ))}
  </div>
);

}
