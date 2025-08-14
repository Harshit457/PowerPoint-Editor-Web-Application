"use client";
import React, { useRef } from "react";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  Image,
} from "lucide-react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { setSelectedTool } from "../store/presentationSlice";

const Toolbar: React.FC = () => {
  const { selectedTool } = useAppSelector((state) => state.presentation);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select", action: () => {} },
    {
      id: "text",
      icon: Type,
      label: "Text",
      action: () => (window as any).canvasActions?.addTextBox(),
    },
    {
      id: "rectangle",
      icon: Square,
      label: "Rectangle",
      action: () => (window as any).canvasActions?.addRectangle(),
    },
    {
      id: "circle",
      icon: Circle,
      label: "Circle",
      action: () => (window as any).canvasActions?.addCircle(),
    },
    {
      id: "line",
      icon: Minus,
      label: "Line",
      action: () => (window as any).canvasActions?.addLine(),
    },
    {
      id: "image",
      icon: Image,
      label: "Image",
      action: () => fileInputRef.current?.click(),
    },
  ];

  const handleToolClick = (toolId: string, action: () => void) => {
    dispatch(setSelectedTool(toolId as any));
    if (toolId !== "select") {
      action();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        (window as any).canvasActions?.addImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-14 flex items-center px-6 bg-gradient-to-r from-[#0F1117] via-[#1A1C23] to-[#0F1117] border-b border-gray-800 shadow-lg">
      <div className="flex items-center gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id, tool.action)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105 border border-blue-400"
                  : "bg-[#1A1C23] text-gray-300 hover:text-white hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 border border-transparent"
              }`}
              title={tool.label}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default Toolbar;
