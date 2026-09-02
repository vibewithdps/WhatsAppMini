export const forceDownload = async (fileUrl, fileName) => {
  try {
    let downloadUrl = fileUrl;
    if (fileUrl.includes('cloudinary.com') && fileUrl.includes('/upload/')) {
       downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || `WhatsApp_Media_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    window.open(fileUrl, '_blank');
  }
};
