"use client";
declare global {
  interface Window {
    store?: {
      getState?: () => any;
    };
    canvasActions?: {
      loadFromCurrentState?: () => void;
      getCurrentSlideData?: () => any;
    };
  }
}

import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { loadPresentation } from '../store/presentationSlice';
import * as fabric from 'fabric';

const FileOperations: React.FC = () => {
  const { slides, activeSlideId } = useAppSelector(state => state.presentation);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSave = async () => {
    console.log('🔍 Starting save process...');
    console.log('🔍 Current active slide ID:', activeSlideId)
    console.log('🔍 Current slides:', slides);
    const fabricCanvas = (window as any).fabricCanvas;
    console.log('🔍 Fabric canvas ref:', fabricCanvas);

    if (!fabricCanvas|| !activeSlideId) {
      console.warn('⚠️ No active canvas or active slide to save.');
      return;
    }

    // 1️⃣ Get the latest canvas JSON directly from the ref
    const freshCanvasData = fabricCanvas.toJSON();
    console.log('🔍 Fresh canvas data:', freshCanvasData);

    // 2️⃣ Update the active slide's canvasData in slides
    const updatedSlides = slides.map(slide => {
      if (slide.id === activeSlideId) {
        console.log('🔍 Updating active slide with fresh canvas data');
        return { ...slide, canvasData: freshCanvasData };
      }
      return slide;
    });

    // 3️⃣ Prepare processed slides with fallback canvas data if missing
    const processedSlides = updatedSlides.map(slide => ({
      ...slide,
      canvasData: slide.canvasData || { version: '6.7.1', objects: [], background: '#ffffff' }
    }));

    // 4️⃣ Prepare final presentation object
    const presentationData = {
      slides: processedSlides,
      activeSlideId,
      version: '1.0',
      timestamp: new Date().toISOString(),
    };

    console.log('🔍 Final presentation data before save:', presentationData);
    console.log(
      '🔍 Active slide canvas data:',
      processedSlides.find((s: any) => s.id === activeSlideId)?.canvasData
    );

    // 5️⃣ Create JSON blob and download
    const blob = new Blob([JSON.stringify(presentationData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Presentation saved successfully!');
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Loading presentation file:', file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        console.log('Parsed presentation data:', data);

        // Validate the data structure
        if (!data.slides || !Array.isArray(data.slides)) {
          alert('Invalid presentation file: missing or invalid slides data');
          return;
        }

        if (!data.activeSlideId) {
          alert('Invalid presentation file: missing activeSlideId');
          return;
        }

        // Validate that activeSlideId exists in slides
        const activeSlideExists = data.slides.some((slide: any) => slide.id === data.activeSlideId);
        if (!activeSlideExists) {
          console.warn('Active slide ID not found in slides, using first slide');
          data.activeSlideId = data.slides[0]?.id || data.activeSlideId;
        }

        // Validate slide structure and ensure canvas data is properly formatted
        const validatedSlides = data.slides.map((slide: any) => ({
          id: slide.id || `slide_${Date.now()}_${Math.random()}`,
          name: slide.name || 'Untitled Slide',
          canvasData: slide.canvasData || { version: '6.7.1', objects: [], background: '#ffffff' },
          thumbnail: slide.thumbnail || null
        }));

        console.log('Loading presentation with slides:', validatedSlides);
        console.log('Active slide canvas data:', validatedSlides.find((s:any) => s.id === data.activeSlideId)?.canvasData);

        // Clear current canvas state before loading
        if ((window as any).fabricCanvas) {
          try {
            (window as any).fabricCanvas.clear();
            console.log('Cleared canvas before loading new presentation');
          } catch (error) {
            console.warn('Could not clear canvas:', error);
          }
        }

        // Dispatch the load action
        dispatch(loadPresentation({
          slides: validatedSlides,
          activeSlideId: data.activeSlideId
        }));

        console.log('Presentation loaded successfully');

        // FIX: Force canvas to reload after Redux state update
        setTimeout(() => {
          console.log('🔄 Attempting to reload canvas after file load...');
          
          // Method 1: Try using the canvas actions
          if ((window as any).canvasActions?.loadFromCurrentState) {
            console.log('✅ Using canvasActions.loadFromCurrentState()');
            (window as any).canvasActions.loadFromCurrentState();
          } else {
            console.log('⚠️ canvasActions.loadFromCurrentState not available');
            
            // Method 2: Fallback - try to get current slide data and log it
            if ((window as any).canvasActions?.getCurrentSlideData) {
              const slideData = (window as any).canvasActions.getCurrentSlideData();
              console.log('Current slide data after load:', slideData);
            }
          }
        }, 500); // Give Redux time to update

        alert('Presentation loaded successfully!');

      } catch (error) {
        console.error('Error parsing presentation file:', error);
        alert('Error loading presentation file. Please check the file format.');
      }
    };

    reader.onerror = (error) => {
      console.error('File reading error:', error);
      alert('Error reading file');
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be loaded again if needed
    event.target.value = '';
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        <Download size={16} />
        Save Presentation
      </button>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
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