"use client";
import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  updateSlideCanvasData,
  updateSlideThumbnail,
  setSelectedElement,
} from "../store/presentationSlice";

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { activeSlideId, slides } = useAppSelector(
    (state) => state.presentation
  );
  const dispatch = useAppDispatch();
  const [currentCanvasSlideId, setCurrentCanvasSlideId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeSlide = slides.find((slide) => slide.id === activeSlideId);

  // Setup fabric canvas instance
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: "#ffffff",
    });
    fabricCanvasRef.current = canvas;

    // Handle object selection events
    const handleSelection = (e: any) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject) {
        dispatch(
          setSelectedElement({
            id: selectedObject.id || "unknown",
            properties: selectedObject.toObject(),
          })
        );
      }
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () =>
      dispatch(setSelectedElement({ id: null, properties: null }))
    );

    // Save changes when objects are modified - but only for the current slide
    canvas.on("object:modified", () => {
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        saveCanvasState();
        generateThumbnail();
      }
    });

    // TODO: These fire a lot - maybe debounce this?
    canvas.on("object:added", () => {
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        saveCanvasState();
        generateThumbnail();
      }
    });

    canvas.on("object:removed", () => {
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        saveCanvasState();
        generateThumbnail();
      }
    });

    return () => {
      canvas.dispose();
    };
  }, [dispatch]);

  // Handle switching between slides - this was tricky to get right
  useEffect(() => {
    if (!fabricCanvasRef.current || !activeSlide || !activeSlideId) return;

    const canvas = fabricCanvasRef.current;
    
    // Block auto-saves while we're switching slides
    setIsLoading(true);

    // Save the current slide before switching away from it
    if (currentCanvasSlideId && currentCanvasSlideId !== activeSlideId) {
      console.log(`Saving slide ${currentCanvasSlideId} before switching`);
      const canvasData = canvas.toJSON();
      dispatch(
        updateSlideCanvasData({
          slideId: currentCanvasSlideId,
          canvasData,
        })
      );
      
      // Generate thumbnail for the slide we're leaving
      const thumbnail = canvas.toDataURL({
        format: "png",
        multiplier: 0.1,
      });
      dispatch(updateSlideThumbnail({ 
        slideId: currentCanvasSlideId, 
        thumbnail 
      }));
    }

    // Clear everything and start fresh
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.discardActiveObject();
    dispatch(setSelectedElement({ id: null, properties: null }));

    // Load the new slide's content
    console.log(`Loading slide ${activeSlideId}`, activeSlide.canvasData);
    
    const finishLoading = () => {
      setCurrentCanvasSlideId(activeSlideId);
      setIsLoading(false);
      canvas.renderAll();
      console.log(`Finished loading slide ${activeSlideId}`);
    };

    if (activeSlide.canvasData && Object.keys(activeSlide.canvasData).length > 0) {
      // Fallback timeout because loadFromJSON can be unreliable sometimes
      const timeoutId = setTimeout(() => {
        console.log(`Timeout loading slide ${activeSlideId}, finishing anyway`);
        finishLoading();
      }, 2000);

      try {
        canvas.loadFromJSON(activeSlide.canvasData, () => {
          clearTimeout(timeoutId);
          canvas.renderAll();
          finishLoading();
          
          // Extra render call - without this, sometimes objects don't show up properly
          setTimeout(() => {
            canvas.renderAll();
          }, 100);
        });
      } catch (error) {
        console.error('Error loading canvas data:', error);
        clearTimeout(timeoutId);
        finishLoading();
      }
    } else {
      // Empty slide - just mark it as loaded
      finishLoading();
    }

  }, [activeSlideId, dispatch]); // NOTE: Don't include currentCanvasSlideId here or we get infinite loops

  // Persist canvas state to redux
  const saveCanvasState = () => {
    if (!fabricCanvasRef.current || !activeSlideId || isLoading) return;
    
    console.log(`Saving canvas state for slide ${activeSlideId}`);
    const canvasData = fabricCanvasRef.current.toJSON();
    dispatch(updateSlideCanvasData({ slideId: activeSlideId, canvasData }));
  };

  // Create a small thumbnail for the slide navigator
  const generateThumbnail = () => {
    if (!fabricCanvasRef.current || !activeSlideId || isLoading) return;
    
    const thumbnail = fabricCanvasRef.current.toDataURL({
      format: "png",
      multiplier: 0.1,
    });
    dispatch(updateSlideThumbnail({ slideId: activeSlideId, thumbnail }));
  };

  // Safety check before adding/modifying objects
  const ensureCorrectSlide = () => {
    return currentCanvasSlideId === activeSlideId && !isLoading;
  };

  // Helper for adding objects with proper IDs
  const addObject = (obj: fabric.Object) => {
    if (!ensureCorrectSlide() || !fabricCanvasRef.current) return;
    
    // Give each object a unique ID for better tracking
    obj.set('id', `${activeSlideId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    fabricCanvasRef.current.add(obj);
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.renderAll();
    
    // The save will happen automatically via object:added event
  };

  const addTextBox = () => {
    const text = new fabric.IText("Click to edit text", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#000000",
    });
    addObject(text);
  };

  const addRectangle = () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      fill: "#3B82F6",
      stroke: "#1D4ED8",
      strokeWidth: 2,
    });
    addObject(rect);
  };

  const addCircle = () => {
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 75,
      fill: "#10B981",
      stroke: "#059669",
      strokeWidth: 2,
    });
    addObject(circle);
  };

  const addLine = () => {
    const line = new fabric.Line([50, 50, 250, 50], {
      stroke: "#EF4444",
      strokeWidth: 3,
      left: 100,
      top: 100,
    });
    addObject(line);
  };

  const addImage = async (source: string | File) => {
    if (!ensureCorrectSlide() || !fabricCanvasRef.current) return;

    const loadImage = async (url: string) => {
      try {
        const img = await fabric.Image.fromURL(url, { crossOrigin: "anonymous" });
        img.set({ 
          left: 100, 
          top: 100, 
          scaleX: 0.5, 
          scaleY: 0.5, 
          selectable: true 
        });
        addObject(img);
      } catch (error) {
        console.error("Error loading image:", error);
      }
    };

    if (typeof source === "string") {
      await loadImage(source);
    } else {
      // Handle file upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) await loadImage(e.target.result as string);
      };
      reader.readAsDataURL(source);
    }
  };

  // For when we need to manually trigger a save (like from toolbar buttons)
  const manualSave = () => {
    saveCanvasState();
    generateThumbnail();
  };

  // Expose these methods globally so the toolbar can call them
  // TODO: This is a bit hacky - should probably use a proper context or ref forwarding
  useEffect(() => {
    (window as any).canvasActions = { 
      addTextBox, 
      addRectangle, 
      addCircle, 
      addLine, 
      addImage,
      manualSave 
    };
    (window as any).fabricCanvas = fabricCanvasRef.current;
  }, [activeSlideId, currentCanvasSlideId, isLoading]);

  return (
    <div className="h-full bg-gray-800 flex items-center justify-center overflow-auto">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden relative">
        <canvas ref={canvasRef} className="border border-gray-200" />
        {isLoading && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
            <span className="mt-3 text-sm text-gray-700 font-medium">
              Loading slide...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasArea;