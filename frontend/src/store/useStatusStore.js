import { create } from 'zustand';
import api from '../services/api';

export const useStatusStore = create((set, get) => ({
  myStatus: { stories: [] },
  recentUpdates: [],
  viewedUpdates: [],
  isLoadingStatus: false,

  // Story Viewer Modal
  isViewerModalOpen: false,
  activeViewingGroup: null, // { user, stories }
  activeStoryIndex: 0,

  // Create Story Modal
  isCreateStatusModalOpen: false,

  setIsCreateStatusModalOpen: (isOpen) => set({ isCreateStatusModalOpen: isOpen }),

  fetchStatusFeed: async () => {
    set({ isLoadingStatus: true });
    try {
      const res = await api.get('/status');
      set({
        myStatus: res.data.myStatus || { stories: [] },
        recentUpdates: res.data.recentUpdates || [],
        viewedUpdates: res.data.viewedUpdates || [],
        isLoadingStatus: false,
      });
    } catch (err) {
      console.error('Failed to fetch status feed:', err);
      set({ isLoadingStatus: false });
    }
  },

  createStatus: async ({ mediaType, text, caption, bgColor, font, mediaFile }) => {
    try {
      const formData = new FormData();
      formData.append('mediaType', mediaType);
      if (text) formData.append('text', text);
      if (caption) formData.append('caption', caption);
      if (bgColor) formData.append('bgColor', bgColor);
      if (font) formData.append('font', font);
      if (mediaFile) formData.append('media', mediaFile);

      await api.post('/status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ isCreateStatusModalOpen: false });
      get().fetchStatusFeed();
    } catch (err) {
      console.error('Failed to create status:', err);
      throw err;
    }
  },

  openStoryViewer: (group, startIndex = 0) => {
    set({
      activeViewingGroup: group,
      activeStoryIndex: startIndex,
      isViewerModalOpen: true,
    });

    // Mark current story viewed
    const story = group.stories[startIndex];
    if (story) {
      get().markStoryViewed(story._id);
    }
  },

  closeStoryViewer: () => {
    set({
      isViewerModalOpen: false,
      activeViewingGroup: null,
      activeStoryIndex: 0,
    });
    get().fetchStatusFeed();
  },

  nextStory: () => {
    const { activeViewingGroup, activeStoryIndex } = get();
    if (!activeViewingGroup) return;

    if (activeStoryIndex < activeViewingGroup.stories.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      set({ activeStoryIndex: nextIdx });
      const story = activeViewingGroup.stories[nextIdx];
      if (story) get().markStoryViewed(story._id);
    } else {
      get().closeStoryViewer();
    }
  },

  prevStory: () => {
    const { activeStoryIndex } = get();
    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    }
  },

  markStoryViewed: async (statusId) => {
    try {
      await api.put(`/status/view/${statusId}`);
    } catch (e) {}
  },

  deleteStatus: async (statusId) => {
    try {
      await api.delete(`/status/${statusId}`);
      get().fetchStatusFeed();
      get().closeStoryViewer();
    } catch (err) {
      console.error('Failed to delete status:', err);
    }
  },
}));
