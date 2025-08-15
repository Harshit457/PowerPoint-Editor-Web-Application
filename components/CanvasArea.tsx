// Fixed version of CanvasArea with better loading handling
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

  // FIX: Get fresh slide data from current state, not stale closure
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
    (window as any).fabricCanvas = canvas;
    console.log('🔍 Fabric canvas initialized:', fabricCanvasRef.current);

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
      console.log('🔍 Canvas event: object:modified fired');
      console.log('🔍 Current slide check:', { currentCanvasSlideId, activeSlideId, isLoading });
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        console.log('✅ Auto-saving due to object:modified');
        saveCanvasState();
        generateThumbnail();
      } else {
        console.log('❌ Skipping auto-save due to slide mismatch or loading');
      }
    });

    canvas.on("object:added", () => {
      console.log('🔍 Canvas event: object:added fired');
      console.log('🔍 Current slide check:', { currentCanvasSlideId, activeSlideId, isLoading });
      console.log('🔍 Canvas objects count:', canvas.getObjects().length);
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        console.log('✅ Auto-saving due to object:added');
        saveCanvasState();
        generateThumbnail();
      } else {
        console.log('❌ Skipping auto-save due to slide mismatch or loading');
      }
    });

    canvas.on("object:removed", () => {
      console.log('🔍 Canvas event: object:removed fired');
      console.log('🔍 Current slide check:', { currentCanvasSlideId, activeSlideId, isLoading });
      if (currentCanvasSlideId === activeSlideId && !isLoading) {
        console.log('✅ Auto-saving due to object:removed');
        saveCanvasState();
        generateThumbnail();
      } else {
        console.log('❌ Skipping auto-save due to slide mismatch or loading');
      }
    });

    return () => {
      canvas.dispose();
    };
  }, [dispatch]);

  // FIX: Separate effect that watches for slide data changes after Redux updates
  useEffect(() => {
    if (!fabricCanvasRef.current || !activeSlide || !activeSlideId) return;
    
    console.log('🔍 Slide effect triggered:', {
      activeSlideId,
      currentCanvasSlideId,
      isLoading,
      hasCanvasData: !!activeSlide.canvasData,
      canvasDataObjects: activeSlide.canvasData?.objects?.length || 0
    });
    
    // Always reload if slide has changed OR if current slide has canvas data but canvas is empty
    const shouldReload = currentCanvasSlideId !== activeSlideId || 
      (currentCanvasSlideId === activeSlideId && 
       activeSlide.canvasData?.objects?.length > 0 && 
       fabricCanvasRef.current.getObjects().length === 0);
    
    if (!isLoading && shouldReload) {
      console.log('🔄 Triggering slide reload due to:', {
        slideChanged: currentCanvasSlideId !== activeSlideId,
        hasDataButEmptyCanvas: activeSlide.canvasData?.objects?.length > 0 && fabricCanvasRef.current.getObjects().length === 0
      });
      loadSlideContent(activeSlide, activeSlideId);
    }
  }, [activeSlide, activeSlideId, slides]); // FIX: Include slides dependency to catch Redux updates

  const loadSlideContent = async (slideData: any, slideId: string) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    console.log(`🔄 Loading slide ${slideId}`, { 
      currentSlide: currentCanvasSlideId, 
      hasCanvasData: !!slideData.canvasData && typeof slideData.canvasData === 'object',
      canvasData: slideData.canvasData
    });
    
    // Block auto-saves while we're switching slides
    setIsLoading(true);

    // Save the current slide before switching away from it
    if (currentCanvasSlideId && currentCanvasSlideId !== slideId) {
      console.log(`💾 Saving slide ${currentCanvasSlideId} before switching`);
      try {
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
      } catch (error) {
        console.error('Error saving current slide:', error);
      }
    }

    // Clear everything and start fresh
    canvas.clear();
    canvas.set('backgroundColor', "#ffffff");
    canvas.discardActiveObject();
    dispatch(setSelectedElement({ id: null, properties: null }));

    const finishLoading = () => {
      setCurrentCanvasSlideId(slideId);
      setIsLoading(false);
      // Force multiple renders to ensure visibility
      canvas.renderAll();
      requestAnimationFrame(() => {
        canvas.renderAll();
        setTimeout(() => {
          canvas.renderAll();
          console.log(`✅ Finished loading slide ${slideId} with ${canvas.getObjects().length} objects`);
        }, 100);
      });
    };

    // FIX: Better validation for canvas data
    const hasValidCanvasData = slideData.canvasData && 
      typeof slideData.canvasData === 'object' && 
      !Array.isArray(slideData.canvasData) &&
      slideData.canvasData.objects &&
      Array.isArray(slideData.canvasData.objects) &&
      slideData.canvasData.objects.length > 0;

    console.log('📋 Canvas data validation:', {
      hasCanvasData: !!slideData.canvasData,
      isObject: typeof slideData.canvasData === 'object',
      notArray: !Array.isArray(slideData.canvasData),
      hasObjects: !!slideData.canvasData?.objects,
      objectsLength: slideData.canvasData?.objects?.length,
      hasValidCanvasData
    });

    if (hasValidCanvasData) {
      try {
        console.log('📥 Loading canvas from JSON...', slideData.canvasData);
        
        // FIX: Use Promise.race to prevent hanging
        const loadPromise = new Promise<void>((resolve, reject) => {
          try {
            canvas.loadFromJSON(slideData.canvasData, () => {
              console.log('✅ Canvas JSON loaded successfully');
              
              // Set canvas dimensions after loading
              canvas.setDimensions({ width: 1280, height: 720 });
              
              // Ensure background is set
              if (slideData.canvasData.background) {
                canvas.set('backgroundColor', slideData.canvasData.background);
              }
              
              // Force visibility and positioning of all objects
              const objects = canvas.getObjects();
              console.log(`📦 Loaded ${objects.length} objects:`, objects);
              
              objects.forEach((obj, index) => {
                obj.set({
                  visible: true,
                  opacity: obj.opacity !== undefined ? obj.opacity : 1,
                  selectable: true,
                  evented: true
                });
                obj.setCoords();
                
                console.log(`  Object ${index}:`, {
                  type: obj.type,
                  left: obj.left,
                  top: obj.top,
                  visible: obj.visible,
                  opacity: obj.opacity
                });
              });
              
              // Force canvas recalculation
              canvas.calcOffset();
              canvas.renderAll();
              
              resolve();
            });
          } catch (error) {
            console.error('❌ loadFromJSON error:', error);
            reject(error);
          }
        });

        // Race between loading and timeout
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Loading timeout')), 5000);
        });

        await Promise.race([loadPromise, timeoutPromise]);
        finishLoading();

      } catch (error) {
        console.error('❌ Error loading canvas data:', error);
        finishLoading();
      }
    } else {
      console.log('📄 Empty slide, finishing loading immediately');
      setTimeout(finishLoading, 100);
    }
  };

  // ENHANCED: Better canvas state persistence with debugging
  const saveCanvasState = () => {
    if (!fabricCanvasRef.current || !activeSlideId || isLoading) return;
    
    console.log(`💾 Saving canvas state for slide ${activeSlideId}`);
    try {
      const canvasData = fabricCanvasRef.current.toJSON();
      console.log('📤 Canvas data from toJSON():', canvasData);
      
      dispatch(updateSlideCanvasData({ slideId: activeSlideId, canvasData }));
      
    } catch (error) {
      console.error('❌ Error saving canvas state:', error);
    }
  };

  // Create a small thumbnail for the slide navigator
  const generateThumbnail = () => {
    if (!fabricCanvasRef.current || !activeSlideId || isLoading) return;
    
    try {
      const thumbnail = fabricCanvasRef.current.toDataURL({
        format: "png",
        multiplier: 0.1,
      });
      dispatch(updateSlideThumbnail({ slideId: activeSlideId, thumbnail }));
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  };

  // Safety check before adding/modifying objects
  const ensureCorrectSlide = () => {
    return currentCanvasSlideId === activeSlideId && !isLoading;
  };

  // Helper for adding objects with proper IDs
  const addObject = (obj: fabric.Object) => {
    if (!ensureCorrectSlide() || !fabricCanvasRef.current) {
      console.log('❌ Cannot add object - wrong slide or no canvas');
      return;
    }
    
    console.log('➕ Adding object to canvas:', obj);
    
    // Give each object a unique ID for better tracking
    obj.set('id', `${activeSlideId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    fabricCanvasRef.current.add(obj);
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.renderAll();
    
    // Debug: Check what's on canvas after adding
    console.log('📦 Canvas objects after add:', fabricCanvasRef.current.getObjects().length);
    
    // Force save immediately after adding
    setTimeout(() => {
      console.log('💾 Auto-saving after object add...');
      saveCanvasState();
    }, 100);
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
    console.log('🔍 Manual save triggered');
    console.log('🔍 Current Redux state slides:', slides);
    console.log('🔍 Active slide data:', activeSlide);
    console.log('🔍 Active slide canvas data:', activeSlide?.canvasData);
    
    saveCanvasState();
    generateThumbnail();
    
    // Check state again after save
    setTimeout(() => {
      const updatedSlide = slides.find(s => s.id === activeSlideId);
      console.log('🔍 Updated slide after manual save:', updatedSlide);
      console.log('🔍 Updated canvas data:', updatedSlide?.canvasData);
    }, 200);
  };

  // FIX: Force reload current slide data
  const forceReloadSlide = () => {
    if (activeSlide && activeSlideId) {
      console.log('🔄 Force reloading current slide...');
      console.log('🔍 Current slide data:', activeSlide);
      console.log('🔍 Canvas data to load:', activeSlide.canvasData);
      setIsLoading(false); // Ensure we're not blocked by loading state
      setCurrentCanvasSlideId(null); // Reset to trigger reload
      setTimeout(() => {
        loadSlideContent(activeSlide, activeSlideId);
      }, 100);
    }
  };

  // NEW: Force load data after file operations
  const loadFromCurrentState = () => {
    if (!activeSlide || !activeSlideId || !fabricCanvasRef.current) return;
    
    console.log('🔄 Loading from current Redux state...');
    console.log('🔍 Active slide:', activeSlide);
    console.log('🔍 Canvas data:', activeSlide.canvasData);
    
    // Force a reload regardless of current state
    setIsLoading(false);
    setCurrentCanvasSlideId(null);
    loadSlideContent(activeSlide, activeSlideId);
  };

  // ENHANCED: Better method exposure
  useEffect(() => {
    const actions = { 
      addTextBox, 
      addRectangle, 
      addCircle, 
      addLine, 
      addImage,
      manualSave,
      forceReloadSlide, 
      loadFromCurrentState, // NEW: Add this method
      // Add debug methods
      forceRender: () => fabricCanvasRef.current?.renderAll(),
      getCanvasData: () => fabricCanvasRef.current?.toJSON(),
      logObjects: () => console.log('Canvas objects:', fabricCanvasRef.current?.getObjects()),
      getCurrentSlideData: () => {
        console.log('Current slide from Redux:', activeSlide);
        console.log('Current slide canvas data:', activeSlide?.canvasData);
        return activeSlide;
      }
    };
    
    (window as any).canvasActions = actions;
    (window as any).fabricCanvas = fabricCanvasRef.current;
    
    // Debug: Log when canvas is ready
    if (fabricCanvasRef.current && currentCanvasSlideId) {
      console.log(`📊 Canvas ready for slide ${currentCanvasSlideId}`, {
        objects: fabricCanvasRef.current.getObjects().length,
        dimensions: { 
          width: fabricCanvasRef.current.width, 
          height: fabricCanvasRef.current.height 
        }
      });
    }
  }, [activeSlideId, currentCanvasSlideId, isLoading, activeSlide]);

  return (
    <div className="h-full bg-gray-800 flex items-center justify-center overflow-auto">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden relative">
        <canvas ref={canvasRef} className="border border-gray-800" />
        {isLoading && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
            <span className="mt-3 text-sm text-gray-700 font-medium">
              Loading slide...
            </span>
          </div>
        )}
        
        {/* Debug info - remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs p-2 rounded space-y-1">
            <div>Slide: {currentCanvasSlideId}</div>
            <div>Objects: {fabricCanvasRef.current?.getObjects().length || 0}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div className="flex gap-1">
              <button 
                onClick={() => {
                  console.log('=== CANVAS DEBUG INFO ===');
                  console.log('Current slide:', currentCanvasSlideId);
                  console.log('Active slide:', activeSlideId);
                  console.log('Canvas objects:', fabricCanvasRef.current?.getObjects());
                  console.log('Active slide data from Redux:', activeSlide);
                  console.log('Slide canvas data:', activeSlide?.canvasData);
                  console.log('Canvas dimensions:', {
                    width: fabricCanvasRef.current?.width,
                    height: fabricCanvasRef.current?.height
                  });
                  fabricCanvasRef.current?.renderAll();
                }}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              >
                Debug
              </button>
              <button 
                onClick={forceReloadSlide}
                className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
              >
                Reload
              </button>
              <button 
                onClick={loadFromCurrentState}
                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
              >
                Load
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default CanvasArea;