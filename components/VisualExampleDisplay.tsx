import React, { useState, useEffect } from 'react';
import { generateVisual } from '../services/geminiService';
import { SpinnerIcon } from './Icons';

interface VisualExampleDisplayProps {
  prompt: string;
  onImageLoaded?: (base64Url: string) => void;
}

export const VisualExampleDisplay: React.FC<VisualExampleDisplayProps> = ({ prompt, onImageLoaded }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const generateImage = async () => {
      setIsLoading(true);
      setError(null);
      setImageUrl(null);
      try {
        const base64Image = await generateVisual(prompt);
        if (!isCancelled) {
          const fullUrl = `data:image/png;base64,${base64Image}`;
          setImageUrl(fullUrl);
          if (onImageLoaded) {
            onImageLoaded(fullUrl);
          }
        }
      } catch (e: any) {
        if (!isCancelled) {
          setError(e.message || 'Failed to generate visual. Please try again later.');
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (prompt) {
      generateImage();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      isCancelled = true;
    };
  }, [prompt, onImageLoaded]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-md mt-2 dark:bg-[#282828]">
        <SpinnerIcon className="w-8 h-8 text-gray-600 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">Generating high-quality diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md p-4 text-center mt-2 dark:bg-[#282828]">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <img src={imageUrl} alt={prompt} className="mt-2 rounded-md w-full border border-gray-300 dark:border-gray-700 shadow-lg" />
  );
};