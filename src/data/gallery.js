// Local gallery data - replaces API calls
// Images are stored in /public/images/gallery/

export const albums = [
  {
    id: '1',
    title: ' natura',
    date: '2025-03-15',
    aspectRatio: '4/3',
    w: 640,
    h: 480,
    cover: '/images/gallery/image1.jpg',
    picturesCount: 9,
    store: 'public'
  },
  {
    id: '2',
    title: 'Seascapes',
    date: '2025-03-10',
    aspectRatio: '16/9',
    w: 800,
    h: 450,
    cover: '/images/gallery/image4.jpg',
    picturesCount: 5,
    store: 'public'
  },
  {
    id: '3',
    title: 'Urban Architecture',
    date: '2025-03-05',
    aspectRatio: '1/1',
    w: 500,
    h: 500,
    cover: '/images/gallery/image2.jpg',
    picturesCount: 7,
    store: 'public'
  },
  {
    id: '4',
    title: 'Portraits',
    date: '2025-02-28',
    aspectRatio: '3/4',
    w: 480,
    h: 640,
    cover: '/images/gallery/image3.jpg',
    picturesCount: 12,
    store: 'public'
  },
  {
    id: '5',
    title: 'Wildlife',
    date: '2025-02-20',
    aspectRatio: '4/3',
    w: 800,
    h: 600,
    cover: '/images/gallery/image9.jpg',
    picturesCount: 8,
    store: 'public'
  }
];

// Generate images for each album (in a real app, these would be different)
function generateImagesForAlbum(album) {
  const count = album.picturesCount;
  const images = [];
  for (let i = 1; i <= count; i++) {
    // Cycle through the 9 sample images based on index
    const imgIndex = ((i - 1) % 9) + 1;
    const filename = `image${imgIndex}.jpg`;
    // Use the album's aspect ratio as base, but vary slightly per image
    const [wRatio, hRatio] = album.aspectRatio.split('/').map(Number);
    // Use predefined sizes from our generated images
    const sizes = [
      { w: 640, h: 480 },
      { w: 500, h: 500 },
      { w: 480, h: 640 },
      { w: 800, h: 450 },
      { w: 600, h: 400 },
      { w: 450, h: 800 },
      { w: 700, h: 500 },
      { w: 500, h: 700 },
      { w: 800, h: 600 }
    ];
    const size = sizes[(imgIndex - 1) % sizes.length];
    images.push({
      filename,
      width: size.w,
      height: size.h,
      aspectRatio: `${size.w}/${size.h}`
    });
  }
  return images;
}

// Full album data with images
export const albumsWithImages = albums.map(album => ({
  ...album,
  images: generateImagesForAlbum(album)
}));

// Get album by ID
export function getAlbumById(id) {
  const album = albumsWithImages.find(a => a.id === id);
  if (album) return { ...album, ok: true };
  return { ok: false, error: 'Album not found' };
}

// Get albums with pagination (simulating API)
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
