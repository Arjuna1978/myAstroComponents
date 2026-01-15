import React, { useRef, useEffect } from 'react';

interface WaterRippleProps {
  // Rendering & Performance
  imageSrc: string;
  width: number;
  height: number;
  className?: string;

  // Interaction Variables
  rippleSize?: number;  // Radius of the disturbance
  strength?: number;    // Initial amplitude (depth)

  // Physics & Fluid Dynamics
  viscosity?: number;   // Damping: 0 (never stops) to 1 (stops instantly)
  speed?: number;       // Propagation: 2.0 (fastest/stable) to 4.0 (slow)
}

const WaterRipple: React.FC<WaterRippleProps> = ({
  imageSrc,
  width,
  height,
  className,
  rippleSize = 4,
  strength = 512,
  viscosity = 0.04,
  speed = 2.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleData = useRef<{ buffer1: Float32Array; buffer2: Float32Array } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const size = width * height;
      rippleData.current = {
        buffer1: new Float32Array(size),
        buffer2: new Float32Array(size),
      };

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);

      const update = () => {
        if (!rippleData.current) return;
        const { buffer1, buffer2 } = rippleData.current;

        // Ensure speed stays within stable bounds (divisor >= 2)
        const s = Math.max(2.0, speed);
        // Convert viscosity to a damping factor (e.g., 0.04 viscosity = 0.96 damping)
        const damping = 1 - viscosity;

        for (let i = width; i < size - width; i++) {
          // Physics: Wave equation with custom propagation speed
          buffer2[i] = ((
            buffer1[i - 1] +
            buffer1[i + 1] +
            buffer1[i - width] +
            buffer1[i + width]
          ) / s - buffer2[i]) * damping;
        }

        // Swap buffers
        rippleData.current.buffer1 = buffer2;
        rippleData.current.buffer2 = buffer1;

        const output = ctx.createImageData(width, height);
        for (let i = 0; i < size; i++) {
          // Refraction logic: calculate pixel offset based on wave gradient
          const xOffset = ~~(buffer1[i - 1] - buffer1[i + 1]);
          const yOffset = ~~(buffer1[i - width] - buffer1[i + width]);

          if (xOffset !== 0 || yOffset !== 0) {
            const reload = i + xOffset + (yOffset * width);
            const finalIdx = Math.max(0, Math.min(size - 1, reload));

            output.data[i * 4] = imgData.data[finalIdx * 4];
            output.data[i * 4 + 1] = imgData.data[finalIdx * 4 + 1];
            output.data[i * 4 + 2] = imgData.data[finalIdx * 4 + 2];
            output.data[i * 4 + 3] = 255;
          } else {
            output.data[i * 4] = imgData.data[i * 4];
            output.data[i * 4 + 1] = imgData.data[i * 4 + 1];
            output.data[i * 4 + 2] = imgData.data[i * 4 + 2];
            output.data[i * 4 + 3] = 255;
          }
        }
        ctx.putImageData(output, 0, 0);
        requestAnimationFrame(update);
      };
      update();
    };
  }, [imageSrc, width, height, viscosity, speed]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!rippleData.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Scale coordinate mapping (crucial if CSS width/height differs from canvas width/height)
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const x = ~~((e.clientX - rect.left) * scaleX);
    const y = ~~((e.clientY - rect.top) * scaleY);

    const { buffer1 } = rippleData.current;

    // Create disturbance based on rippleSize
    for (let j = y - rippleSize; j < y + rippleSize; j++) {
      for (let k = x - rippleSize; k < x + rippleSize; k++) {
        if (j >= 0 && j < height && k >= 0 && k < width) {
          buffer1[j * width + k] = strength;
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      className={className}
      style={{ display: 'block' }}
    />
  );
};

export default WaterRipple;
