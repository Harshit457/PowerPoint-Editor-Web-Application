import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Slide {
  id: string;
  name: string;
  canvasData: string;
  thumbnail?: string;
}

export interface PresentationState {
  slides: Slide[];
  activeSlideId?: string;
  selectedTool: 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'image';
  selectedElementId: string | null;
  selectedElementProperties: any;
}

const initialState: PresentationState = {
  slides: [
    {
      id: 'slide-1',
      name: 'Slide 1',
      canvasData: '[]',
    }
  ],
  activeSlideId: 'slide-1',
  selectedTool: 'select',
  selectedElementId: null,
  selectedElementProperties: null,
};

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    addSlide: (state) => {
      const newSlide: Slide = {
        id: `slide-${Date.now()}`,
        name: `Slide ${state.slides.length + 1}`,
        canvasData: '[]',
      };
      state.slides.push(newSlide);
      state.activeSlideId = newSlide.id;
    },
    deleteSlide: (state, action: PayloadAction<string>) => {
      if (state.slides.length <= 1) return;
      const slideIndex = state.slides.findIndex(slide => slide.id === action.payload);
      if (slideIndex === -1) return;
      state.slides.splice(slideIndex, 1);

      state.slides.forEach((slide, index) => {
        slide.name = `Slide ${index + 1}`;
      });

      if (state.activeSlideId === action.payload) {
        const newIndex = Math.min(slideIndex, state.slides.length - 1);
        state.activeSlideId = state.slides[newIndex]?.id;
      }

      state.selectedElementId = null;
      state.selectedElementProperties = null;
      state.selectedTool = 'select';
    },
    setActiveSlide: (state, action: PayloadAction<string>) => {
      state.activeSlideId = action.payload;
    },
    updateSlideCanvasData: (state, action: PayloadAction<{ slideId: string; canvasData: string }>) => {
      const slide = state.slides.find(s => s.id === action.payload.slideId);
      if (slide) {
        slide.canvasData = action.payload.canvasData;
      }
    },
    updateSlideThumbnail: (state, action: PayloadAction<{ slideId: string; thumbnail: string }>) => {
      const slide = state.slides.find(s => s.id === action.payload.slideId);
      if (slide) {
        slide.thumbnail = action.payload.thumbnail;
      }
    },
    setSelectedTool: (state, action: PayloadAction<PresentationState['selectedTool']>) => {
      state.selectedTool = action.payload;
    },
    setSelectedElement: (state, action: PayloadAction<{ id: string | null; properties: any }>) => {
      state.selectedElementId = action.payload.id;
      state.selectedElementProperties = action.payload.properties;
    },
    updateElementProperty: (state, action: PayloadAction<{ property: string; value: any }>) => {
      if (state.selectedElementProperties) {
        state.selectedElementProperties[action.payload.property] = action.payload.value;
      }
    },
    deleteElement: (state, action: PayloadAction<string | null>) => {
      if (state.selectedElementId === action.payload) {
        state.selectedElementId = null;
        state.selectedElementProperties = null;
      }
    },
    loadPresentation: (state, action: PayloadAction<{ slides: Slide[]; activeSlideId: string }>) => {
      state.slides = action.payload.slides;
      state.activeSlideId = action.payload.activeSlideId;
    },
  },
});

export const {
  addSlide,
  deleteSlide,
  setActiveSlide,
  updateSlideCanvasData,
  updateSlideThumbnail,
  setSelectedTool,
  setSelectedElement,
  updateElementProperty,
  deleteElement,
  loadPresentation,
} = presentationSlice.actions;

export default presentationSlice.reducer;
