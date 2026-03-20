# Vue 3 Gallery SPA

A modern, responsive gallery single-page application built with Vue 3, Vite, and Tailwind CSS. Features a masonry layout, lightbox, and automatic image discovery.

## Project Overview

This is a Vue 3 frontend application that displays image galleries with:

- **Masonry layout** using pure CSS columns (no JavaScript libraries)
- **Lightbox** with keyboard navigation (arrow keys, Escape)
- **Responsive design** optimized for mobile and desktop
- **Automatic image discovery** via Vite's `import.meta.glob`
- **Clean URLs** with proper SPA routing support
- **Thai fonts** (Noto Sans Thai) included

The application expects images to be placed in `src/assets/gallery/`. Album data is automatically generated from the image filenames and metadata.

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Start Vite dev server
npm run dev
```

Open your browser to the URL shown (usually `http://localhost:5173`). The app will hot-reload as you make changes.

## Building for Production

```bash
# Create an optimized production build
npm run build
```

The build output will be in the `dist/` directory. This folder contains:

- `index.html` - Entry point (and `404.html` for SPA routing fallback)
- `assets/` - Bundled CSS, JS, and image assets with hashed filenames
- `fonts/` - Thai font files
- `icons/` - Favicon and other icons

### Preview Production Build

```bash
# Serve the dist folder locally
npm run preview
```

This starts a static file server to test the production build.

## Standard Web Server Deployment

### Nginx

Create a server block configuration (e.g., `/etc/nginx/sites-available/gallery`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gallery/dist;
    index index.html;

    location / {
        # SPA: redirect all routes to index.html
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (images, fonts, JS, CSS)
    location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers (optional but recommended)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/gallery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Copy the `dist/` folder to `/var/www/gallery/` (adjust paths as needed).

### Apache

Place the `dist/` folder contents in your web root (e.g., `/var/www/html/gallery`). Create a `.htaccess` file inside that directory:

```apache
RewriteEngine On
# If a directory or file exists, use it directly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
# Otherwise, redirect to index.html for Vue Router
RewriteRule ^ index.html [L]

# Optional: cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

Ensure `mod_rewrite` is enabled:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## Docker & Docker Compose Deployment

### Dockerfile

Place this `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage: serve with nginx
FROM nginx:alpine
# Copy build output to nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create a `docker-compose.yml` to orchestrate the container:

```yaml
version: '3.8'
services:
  gallery:
    build: .
    container_name: gallery-spa
    ports:
      - "8080:80"
    restart: unless-stopped
    # Optional: mount local assets for development
    # volumes:
    #   - ./src/assets/gallery:/usr/share/nginx/html/assets/gallery:ro
```

### Build and Run

```bash
# Build the Docker image and start the container
docker-compose up -d --build

# The app will be available at http://localhost:8080
```

### Production Docker (No Compose)

```bash
# Build the image
docker build -t gallery-spa:latest .

# Run the container
docker run -d \
  --name gallery-spa \
  -p 80:80 \
  --restart unless-stopped \
  gallery-spa:latest
```

## Project Structure

```
├── src/
│   ├── assets/
│   │   ├── gallery/          # Place your images here
│   │   │   ├── image1.jpg
│   │   │   └── ...
│   │   ├── main.css          # Global styles + Tailwind
│   │   └── ...
│   ├── components/
│   ├── data/
│   │   └── gallery.js        # Auto-generates albums from images
│   ├── router/
│   │   └── index.js          # Vue Router configuration
│   ├── views/
│   │   ├── GalleryView.vue   # Gallery listing page
│   │   └── AlbumView.vue     # Individual album page
│   ├── App.vue
│   └── main.js
├── public/                    # Static files (favicon, etc.)
├── dist/                      # Production build output (generated)
├── index.html                 # SPA entry point
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── package.json
└── Dockerfile
```

## Adding Images

1. Place your image files (`.jpg`, `.png`, `.webp`, etc.) into `src/assets/gallery/`.
2. Run `npm run build` to regenerate the app. The images will be automatically discovered and organized into albums (3 images per album by default). You can customize the album grouping logic in `src/data/gallery.js`.

## Configuration Notes

- **Base URL**: If deploying to a subdirectory (e.g., `https://example.com/gallery/`), update `base: '/test2026_1/'` in `vite.config.js` to match your path. Also update the `404.html` copy command in `package.json` if needed.
- **Router**: This app uses Web History mode (`createWebHistory`) with base auto-detected from Vite's `BASE_URL`. For GitHub Pages, `404.html` is automatically created as a fallback.
- **CSS Masonry**: The album view uses Tailwind's `columns-*` utilities. Ensure your `tailwind.config.js` includes the content paths as shown.

## License

ISC
