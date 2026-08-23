import { create } from 'zustand';

export const useImageViewerStore = create((set) => ({
  isOpen: false,
  imageUrl: null,
  title: '',
  subtitle: '',
  user: null,

  openImageViewer: ({ imageUrl, title = 'Profile Photo', subtitle = '', user = null }) =>
    set({
      isOpen: true,
      imageUrl,
      title,
      subtitle,
      user,
    }),

  closeImageViewer: () =>
    set({
      isOpen: false,
      imageUrl: null,
      title: '',
      subtitle: '',
      user: null,
    }),
}));
