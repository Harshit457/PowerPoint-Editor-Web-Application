import SlidePanel from "@/components/SlidePanel";
import Toolbar from "@/components/Toolbar";
import CanvasArea from "@/components/CanvasArea";
import PropertiesPanel from "@/components/PropertiesPanel";

export default function Home() {
  return (
    <div className="main">
      <div className="flex h-screen bg-gray-100 overflow-x-auto">
        {/* Left Panel - Slides */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <SlidePanel />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-[600px] flex flex-col">
          <div className="h-16 bg-white border-b border-gray-200 flex-shrink-0">
            <Toolbar />
          </div>
          <div className="flex-1 overflow-hidden">
            <CanvasArea />
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}
