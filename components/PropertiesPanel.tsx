"use client";
import React from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  updateElementProperty,
  deleteElement,
} from "../store/presentationSlice";

const PropertiesPanel: React.FC = () => {
  const { selectedElementId, selectedElementProperties } = useAppSelector(
    (state) => state.presentation
  );
  const dispatch = useAppDispatch();

  const handlePropertyChange = (property: string, value: any) => {
    dispatch(updateElementProperty({ property, value }));

    if ((window as any).fabricCanvas) {
      const activeObject = (window as any).fabricCanvas.getActiveObject();
      if (activeObject) {
        activeObject.set(property, value);
        (window as any).fabricCanvas.renderAll();
      }
    }
  };

  const handleDelete = () => {
    if ((window as any).fabricCanvas) {
      const activeObject = (window as any).fabricCanvas.getActiveObject();
      if (activeObject) {
        (window as any).fabricCanvas.remove(activeObject);
        (window as any).fabricCanvas.discardActiveObject();
        (window as any).fabricCanvas.renderAll();
      }
    }
    dispatch(deleteElement(selectedElementId));
  };

  const panelBg = "bg-gradient-to-b from-[#0F1117] to-[#1A1C23] text-gray-200";

  if (!selectedElementId || !selectedElementProperties) {
    return (
      <div className={`h-full p-6 ${panelBg}`}>
        <h2 className="text-lg font-semibold text-white mb-4">Properties</h2>
        <div className="text-gray-500 text-center mt-8">
          <p>Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const baseInputClasses =
    "w-full px-3 py-2 rounded-lg text-sm bg-[#1E212A] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-200";
  const colorInputClasses =
    "w-8 h-8 rounded border border-gray-500 cursor-pointer bg-transparent";

  const labelClasses = "block text-sm font-medium text-gray-300 mb-2";

  const renderColorInput = (label: string, property: string, value: string) => (
    <div className="mb-4">
      <label className={labelClasses}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => handlePropertyChange(property, e.target.value)}
          className={colorInputClasses}
        />
        <input
          type="text"
          value={value || "#000000"}
          onChange={(e) => handlePropertyChange(property, e.target.value)}
          className={baseInputClasses}
        />
      </div>
    </div>
  );

  const renderNumberInput = (
    label: string,
    property: string,
    value: number,
    min?: number,
    max?: number
  ) => (
    <div className="mb-4">
      <label className={labelClasses}>{label}</label>
      <input
        type="number"
        value={value || 0}
        onChange={(e) =>
          handlePropertyChange(property, parseFloat(e.target.value))
        }
        min={min}
        max={max}
        className={baseInputClasses}
      />
    </div>
  );

  const renderTextInput = (
    label: string,
    property: string,
    value: string
  ) => (
    <div className="mb-4">
      <label className={labelClasses}>{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handlePropertyChange(property, e.target.value)}
        className={baseInputClasses}
      />
    </div>
  );

  return (
    <div
      className={`h-full overflow-y-auto p-6 flex flex-col ${panelBg} border-l border-gray-800`}
    >
      <h2 className="text-lg font-semibold text-white mb-4">Properties</h2>

      <div className="space-y-1 flex-1">
        {/* Position */}
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput("Left", "left", selectedElementProperties.left)}
          {renderNumberInput("Top", "top", selectedElementProperties.top)}
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput(
            "Width",
            "width",
            selectedElementProperties.width ||
              selectedElementProperties.scaleX * 100
          )}
          {renderNumberInput(
            "Height",
            "height",
            selectedElementProperties.height ||
              selectedElementProperties.scaleY * 100
          )}
        </div>

        {/* Rotation */}
        {renderNumberInput(
          "Rotation",
          "angle",
          selectedElementProperties.angle || 0,
          0,
          360
        )}

        {/* Text-specific */}
        {selectedElementProperties.type === "i-text" && (
          <>
            {renderTextInput("Text", "text", selectedElementProperties.text)}
            {renderNumberInput(
              "Font Size",
              "fontSize",
              selectedElementProperties.fontSize
            )}
            {renderColorInput(
              "Text Color",
              "fill",
              selectedElementProperties.fill
            )}
            {renderTextInput(
              "Font Family",
              "fontFamily",
              selectedElementProperties.fontFamily
            )}
          </>
        )}

        {/* Shape fill/stroke */}
        {selectedElementProperties.fill !== undefined &&
          renderColorInput("Fill Color", "fill", selectedElementProperties.fill)}
        {selectedElementProperties.stroke !== undefined &&
          renderColorInput(
            "Stroke Color",
            "stroke",
            selectedElementProperties.stroke
          )}

        {/* Stroke width */}
        {selectedElementProperties.strokeWidth !== undefined &&
          renderNumberInput(
            "Stroke Width",
            "strokeWidth",
            selectedElementProperties.strokeWidth,
            0,
            20
          )}

        {/* Line-specific */}
        {selectedElementProperties.type === "line" && (
          <>
            {renderNumberInput(
              "Line Width",
              "strokeWidth",
              selectedElementProperties.strokeWidth,
              1,
              20
            )}
          </>
        )}

        {/* Image-specific */}
        {selectedElementProperties.type === "image" && (
          <>
            {renderNumberInput(
              "Opacity",
              "opacity",
              selectedElementProperties.opacity || 1,
              0,
              1
            )}
          </>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md shadow-red-500/30"
      >
        Delete Element
      </button>
    </div>
  );
};

export default PropertiesPanel;
