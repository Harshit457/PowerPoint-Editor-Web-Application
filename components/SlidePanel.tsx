"use client";
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  addSlide,
  deleteSlide,
  setActiveSlide,
  updateSlideCanvasData,
} from "../store/presentationSlice";
import FileOperations from "./FileOperations";

const SlidePanel: React.FC = () => {
  const { slides, activeSlideId } = useAppSelector(
    (state) => state.presentation
  );
  const dispatch = useAppDispatch();

  const handleAddSlide = () => {
    dispatch(addSlide());
  };

  const handleDeleteSlide = (slideId: string) => {
    dispatch(deleteSlide(slideId));
  };

  const handleSelectSlide = (slideId: string) => {
    if ((window as any).fabricCanvas && activeSlideId) {
      try {
        const canvasData = (window as any).fabricCanvas.toJSON();
        dispatch(updateSlideCanvasData({ slideId: activeSlideId, canvasData }));
      } catch (err) {
        console.warn("Failed to save canvas before switching slides:", err);
      }
    }
    dispatch(setActiveSlide(slideId));
  };

  return (
    <div className="h-full flex flex-col bg-[#0F1117] text-white border-r border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white tracking-wide">
          Slides
        </h2>
        <button
          onClick={handleAddSlide}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:scale-105 hover:shadow-blue-500/30 transition-all duration-300"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative group p-2 rounded-lg border transition-all duration-300 transform hover:scale-[1.02] ${
              activeSlideId === slide.id
                ? "border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/10"
                : "border-gray-700 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/20"
            }`}
            onClick={() => handleSelectSlide(slide.id)}
          >
            <div className="aspect-video bg-[#1A1C23] rounded border border-gray-700 overflow-hidden">
              {slide.thumbnail ? (
                <img
                  src={slide.thumbnail}
                  alt={slide.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <span className="text-sm font-medium">
                    Slide {index + 1}
                  </span>
                </div>
              )}
            </div>

            {/* Slide Name */}
            <p className="mt-2 text-sm font-medium text-gray-300 truncate">
              {slide.name}
            </p>

            {/* Delete Button */}
            {slides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSlide(slide.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-[#14161D]">
        <FileOperations />
      </div>

      {/* Custom Scrollbar Styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #9333ea);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default SlidePanel;
