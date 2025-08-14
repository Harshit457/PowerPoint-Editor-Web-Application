"use client";
import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { loadPresentation } from '../store/presentationSlice';

const FileOperations: React.FC = () => {
  const { slides, activeSlideId } = useAppSelector(state => state.presentation);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const presentationData = {
      slides,
      activeSlideId,
      version: '1.0',
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(presentationData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.slides && data.activeSlideId) {
          dispatch(loadPresentation({
            slides: data.slides,
            activeSlideId: data.activeSlideId
          }));
        } else {
          alert('Invalid presentation file format');
        }
      } catch (error) {
        alert('Error loading presentation file');
        console.error('Error parsing presentation file:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Download size={16} />
        Save Presentation
      </button>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Upload size={16} />
        Load Presentation
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleLoad}
        className="hidden"
      />
    </div>
  );
};

export default FileOperations;