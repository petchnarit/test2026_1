<template>
  <div>
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex-shrink-0">
            <router-link to="/" class="text-2xl font-bold text-gray-900">Gallery by comcenter</router-link>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-8">
              <router-link to="/" class="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Gallery</router-link>
            </div>
          </div>
          <div class="md:hidden">
            <button id="mobile-menu-btn" class="text-gray-700 hover:text-gray-900 p-2" aria-label="Open Menu">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link to="/" class="block text-gray-700 hover:bg-gray-50 px-3 py-2 text-base font-medium">Gallery</router-link>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <section class="py-8 lg:py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="album-title" class="text-3xl sm:text-4xl font-bold text-gray-900 mb-0">{{ album?.title || 'Loading...' }}</h2>
      </div>
    </section>

    <!-- Content -->
    <main class="py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- CSS Masonry Grid -->
        <div v-if="album && album.images.length" class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          <div v-for="(img, idx) in album.images" :key="idx" class="break-inside-avoid mb-4">
            <img
              :src="img.url"
              :alt="`${album.title} - ${img.filename}`"
              class="w-full rounded-lg shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
              loading="lazy"
              @click="openLightbox(idx)"
            />
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="album" class="hidden text-center py-16">
          <p class="text-gray-500">ไม่พบรูปภาพในคอลเลกชันนี้</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-center py-16">
          <p class="text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p class="text-gray-500 mt-1">{{ error }}</p>
        </div>
      </div>
    </main>

    <!-- Lightbox -->
    <div v-if="lightboxOpen" id="lightbox" class="fixed inset-0 z-[60] bg-black/90" @click="closeLightbox">
      <button class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Close" @click.stop="closeLightbox">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button class="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Previous" @click.stop="prevImage">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button class="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Next" @click.stop="nextImage">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <a :href="currentImage.url" :download="currentImage.filename" class="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Download" @click.stop>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>

      <div class="w-full h-full flex items-center justify-center p-4">
        <img :src="currentImage.url" :alt="album.title" class="max-h-full max-w-full object-contain select-none" />
      </div>
    </div>

    <footer class="bg-gray-50 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2025 งานศูนย์คอมพิวเตอร์</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAlbumById } from '../data/gallery'

const route = useRoute()

const album = ref(null)
const error = ref(null)
const lightboxOpen = ref(false)
const currentIndex = ref(0)

const currentImage = computed(() => {
  if (!album.value || !album.value.images.length) return { filename: '', url: '' }
  return album.value.images[currentIndex.value] || { filename: '', url: '' }
})

const openLightbox = (idx) => {
  currentIndex.value = idx
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  if (!album.value?.images.length) return
  currentIndex.value = (currentIndex.value - 1 + album.value.images.length) % album.value.images.length
}

const nextImage = () => {
  if (!album.value?.images.length) return
  currentIndex.value = (currentIndex.value + 1) % album.value.images.length
}

const handleKeydown = (e) => {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

onMounted(() => {
  const id = route.params.id
  if (!id) {
    error.value = 'ไม่พบค่า id จาก URL'
    return
  }

  const result = getAlbumById(id)
  if (!result.ok) {
    error.value = 'Album not found'
    return
  }

  album.value = result
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
