// Local gallery data - uses Vite's import.meta.glob to auto-discover images
// Images are stored in /src/assets/gallery/

// Get all image files as URLs
const imageModules = import.meta.glob('/src/assets/gallery/*.{jpg,jpeg,png,webp,gif}', { eager: true, as: 'url' });

// Build image metadata from filenames (aspect ratios for demo)
const imageMeta = {
  'image1.jpg': { aspectRatio: '4/3', w: 640, h: 480 },
  'image2.jpg': { aspectRatio: '1/1', w: 500, h: 500 },
  'image3.jpg': { aspectRatio: '3/4', w: 480, h: 640 },
  'image4.jpg': { aspectRatio: '16/9', w: 800, h: 450 },
  'image5.jpg': { aspectRatio: '3/2', w: 600, h: 400 },
  'image6.jpg': { aspectRatio: '9/16', w: 450, h: 800 },
  'image7.jpg': { aspectRatio: '7/5', w: 700, h: 500 },
  'image8.jpg': { aspectRatio: '5/7', w: 500, h: 700 },
  'image9.jpg': { aspectRatio: '4/3', w: 800, h: 600 }
};

// Convert glob result to sorted array
let allImages = Object.entries(imageModules)
  .map(([path, mod]) => {
    const filename = path.split('/').pop();
    // When using import.meta.glob with eager:true, the value may be a module object with .default
    // For assets with as: 'url', it should be a string, but we handle both cases.
    const url = (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod;
    return {
      filename,
      url,
      ...(imageMeta[filename] || { aspectRatio: '4/3', w: 640, h: 480 })
    };
  })
  .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

// Create albums from images (3 images per album for demo)
function createAlbumsFromImages(images) {
  const imagesPerAlbum = 3;
  const albums = [];
  for (let i = 0; i < images.length; i += imagesPerAlbum) {
    const group = images.slice(i, i + imagesPerAlbum);
    const albumNum = Math.floor(i / imagesPerAlbum) + 1;
    albums.push({
      id: String(albumNum),
      title: `Album ${albumNum}`,
      date: '2025-03-15',
      aspectRatio: group[0].aspectRatio,
      w: group[0].w,
      h: group[0].h,
      cover: group[0].url,
      picturesCount: group.length,
      store: 'public',
      images: group.map(img => ({
        filename: img.filename,
        width: img.w,
        height: img.h,
        aspectRatio: img.aspectRatio,
        url: img.url
      }))
    });
  }
  return albums;
}

const albums = createAlbumsFromImages(allImages);
const albumsWithImages = albums;

// Get album by ID
export function getAlbumById(id) {
  const album = albumsWithImages.find(a => a.id === id);
  if (album) return { ...album, ok: true };
  return { ok: false, error: 'Album not found' };
}

// Get albums with pagination
export function getAlbums(page = 1, perPage = 18) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paged = albums.slice(start, end);
  return {
    galleries: paged,
    page,
    total: albums.length,
    totalPages: Math.ceil(albums.length / perPage)
  };
}
