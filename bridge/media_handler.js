// AetherChat - Universal Media Engine (Images, Videos, & Attachments)

class MediaHandler {
  constructor() {
    this.pendingAttachments = []; // Array of { file, type, previewUrl, name, size }
  }

  // 1. Detect and Extract Images & Videos from Native DOM Nodes
  extractMediaFromNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return [];
    const mediaList = [];
    const seenUrls = new Set();

    // Strategy A: Video elements
    const videos = [];
    if (node.matches && node.matches('video')) videos.push(node);
    if (node.querySelectorAll) videos.push(...node.querySelectorAll('video'));

    videos.forEach((vid) => {
      const src = vid.src || (vid.querySelector('source') ? vid.querySelector('source').src : '');
      if (src && !seenUrls.has(src) && !src.startsWith('data:image/svg')) {
        seenUrls.add(src);
        mediaList.push({
          type: 'video',
          url: src,
          poster: vid.poster || ''
        });
      }
    });

    // Strategy B: Image elements (filter out small emojis & avatars)
    const images = [];
    if (node.matches && node.matches('img')) images.push(node);
    if (node.querySelectorAll) images.push(...node.querySelectorAll('img'));

    images.forEach((img) => {
      const src = img.currentSrc || img.src || img.getAttribute('src') || '';
      if (!src || seenUrls.has(src)) return;

      // Filter out emojis, SVGs, profile icons, and tracking pixels
      const isEmoji = img.classList.contains('emoji') ||
                      (img.alt && img.alt.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(img.alt));
      const isAvatar = (img.width && img.width < 45 && img.height && img.height < 45) ||
                       img.classList.contains('avatar') ||
                       img.getAttribute('alt')?.toLowerCase().includes('profile');

      if (!isEmoji && !isAvatar && (img.naturalWidth > 50 || img.width > 50 || src.startsWith('blob:') || src.startsWith('data:image') || src.includes('/media') || src.includes('instagram.com') || src.includes('cdn'))) {
        seenUrls.add(src);
        mediaList.push({
          type: 'image',
          url: src,
          alt: img.alt || 'Attached image'
        });
      }
    });

    // Strategy C: Background-image containers (common for thumbnails / previews)
    if (mediaList.length === 0 && node.querySelectorAll) {
      const bgElements = [node, ...node.querySelectorAll('div[style*="background-image"], span[style*="background-image"]')];
      bgElements.forEach((el) => {
        try {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundImage || '';
          const match = bg.match(/url\(["']?(https?:\/\/[^"')]+|blob:[^"')]+|data:image\/[^"')]+)["']?\)/);
          if (match && match[1] && !seenUrls.has(match[1])) {
            const url = match[1];
            if (!url.includes('avatar') && !url.includes('profile')) {
              seenUrls.add(url);
              mediaList.push({
                type: 'image',
                url: url,
                alt: 'Attached image'
              });
            }
          }
        } catch (e) {}
      });
    }

    return mediaList;
  }

  // 2. Add an Outgoing Attachment (Image or Video)
  async addAttachment(file) {
    if (!file) return null;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return null;

    const previewUrl = URL.createObjectURL(file);
    const item = {
      file,
      type: isVideo ? 'video' : 'image',
      previewUrl,
      name: file.name || (isVideo ? 'video.mp4' : 'image.png'),
      size: file.size || 0
    };

    this.pendingAttachments.push(item);
    return item;
  }

  removeAttachment(index) {
    if (index >= 0 && index < this.pendingAttachments.length) {
      const [removed] = this.pendingAttachments.splice(index, 1);
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return true;
    }
    return false;
  }

  clearAttachments() {
    this.pendingAttachments.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.pendingAttachments = [];
  }

  getAttachments() {
    return [...this.pendingAttachments];
  }

  // 3. Dispatch Media File Directly into Native Platform Composer
  async dispatchMediaToNativeComposer(nativeInput, files) {
    if (!files || files.length === 0 || !nativeInput) return false;

    // Strategy 1: Modern Synthetic Clipboard Paste (Supported by WhatsApp, Discord, X, Instagram)
    try {
      const dt = new DataTransfer();
      for (const f of files) {
        dt.items.add(f);
      }

      nativeInput.focus();
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });

      const handled = nativeInput.dispatchEvent(pasteEvent);
      if (handled) {
        console.log('[AetherChat Media] Dispatched media via ClipboardEvent paste');
        return true;
      }
    } catch (e) {
      console.warn('[AetherChat Media] Paste dispatch fallback:', e);
    }

    // Strategy 2: File Input Assignment
    try {
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
      // Prefer file input with accept image or video
      const targetInput = fileInputs.find(i => (i.accept && (i.accept.includes('image') || i.accept.includes('video')))) || fileInputs[0];

      if (targetInput) {
        const dt = new DataTransfer();
        for (const f of files) {
          dt.items.add(f);
        }
        targetInput.files = dt.files;
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[AetherChat Media] Dispatched media via native file input');
        return true;
      }
    } catch (e) {
      console.warn('[AetherChat Media] File input fallback error:', e);
    }

    return false;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MediaHandler };
} else {
  window.MediaHandler = MediaHandler;
}
