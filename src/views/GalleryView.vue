<template>
  <div>
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex-shrink-0">
            <a href="/" class="text-2xl font-bold text-gray-900">Gallery by comcenter</a>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-8">
              <a href="/" class="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Gallery</a>
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
          <a href="/" class="block text-gray-700 hover:bg-gray-50 px-3 py-2 text-base font-medium">Gallery</a>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="main-content" role="main">
      <!-- Gallery Section -->
      <section class="py-8 lg:py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Gallery</h2>
        </div>
      </section>

      <section class="py-4 lg:py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="mb-8 flex justify-between items-center">
            <div class="text-sm text-gray-600">
              Showing <span id="showing-start">{{ showingStart }}</span> to <span id="showing-end">{{ showingEnd }}</span> of <span id="showing-total">{{ totalItems }}</span> collections
            </div>
            <div class="text-sm text-gray-600">
              Page <span id="current-page">{{ currentPage }}</span> of <span id="total-pages">{{ totalPages }}</span>
            </div>
          </div>

          <!-- Masonry container -->
          <div class="masonry-container" id="gallery-masonry" style="min-height:400px;"></div>

          <!-- Pagination -->
          <div class="mt-12 flex justify-center">
            <nav class="flex items-center gap-2" aria-label="Pagination">
              <button
                id="prev-page"
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="currentPage <= 1"
                @click="prevPage"
              >
                Previous
              </button>
              <div id="page-numbers" class="flex gap-2"></div>
              <button
                id="next-page"
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="currentPage >= totalPages"
                @click="nextPage"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'
import { getAlbums } from '../data/gallery'

const itemsPerPage = 18
const WIDTHS = [320, 640, 1024, 2048]
const SIZES = '(min-width: 640px) 50vw, 100vw'

const router = useRouter()
const route = useRoute()

const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const showingStart = ref(0)
const showingEnd = ref(0)

let msnry = null

// Helpers
const $ = (q, root = document) => root.querySelector(q)
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q))

function withParams(url, extra) {
  const u = new URL(url, location.origin)
  Object.entries(extra).forEach(([k, v]) => {
    if (v != null && v !== '') u.searchParams.set(k, v)
  })
  return u.toString()
}

function buildWebpSrcsetFromCover(coverUrl, widths = WIDTHS) {
  return widths.map(w => withParams(coverUrl, { w, q: 80 })).map((u, i) => `${u} ${widths[i]}w`).join(', ')
}

function initMasonry(container) {
  if (msnry?.destroy) msnry.destroy()
  msnry = new Masonry(container, {
    itemSelector: '.masonry-item',
    columnWidth: '.grid-sizer',
    gutter: '.gutter-sizer',
    percentPosition: true,
    transitionDuration: '0.2s',
  })
  imagesLoaded(container).on('progress', () => msnry.layout())
}

function preloadImage(url) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = url
  document.head.appendChild(link)
}

function renderGallery(galleries, page, total, totalPagesServer) {
  const container = $('#gallery-masonry')
  if (!container) return
  container.innerHTML = `<div class="grid-sizer"></div><div class="gutter-sizer"></div>`

  const cards = galleries.map((g, i) => {
    const [wRatio, hRatio] = (g.aspectRatio || '4/3').split('/').map(Number)
    const width = g.w ?? 320
    const height = g.h ?? Math.round(width * (hRatio / wRatio))
    const cover = g.cover
    const srcset = buildWebpSrcsetFromCover(cover, [320, 640])
    const viewUrl = `/view/${encodeURIComponent(g.id)}`

    let loading = 'lazy'
    let fetchpriority = 'low'
    if (page === 1 && i === 0) {
      loading = 'eager'
      fetchpriority = 'high'
      preloadImage(withParams(cover, { w: 640, q: 80 }))
    }

    return `
      <article class="masonry-item">
        <a href="${viewUrl}" class="group block rounded-lg overflow-hidden transition-all transform hover:-translate-y-1 hover:shadow-xl bg-white shadow-md">
          <div class="relative overflow-hidden" style="aspect-ratio:${wRatio}/${hRatio};background:#f0f0f0">
            <picture>
              <source type="image/webp" srcset="${srcset}" sizes="${SIZES}">
              <img
                src="${withParams(cover,{w:32,q:10})}"
                srcset="${srcset}"
                sizes="${SIZES}"
                alt="${g.title}"
                width="${width}"
                height="${height}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="${loading}"
                decoding="async"
                fetchpriority="${fetchpriority}"
              />
            </picture>
          </div>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2">${g.title}</h3>
            <div class="flex items-center text-sm text-gray-500">
              <svg class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ${new Date(g.date).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}
            </div>
            <div class="flex items-center text-sm text-gray-500 mt-1">
              <svg class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ${g.picturesCount ?? 0} photos
            </div>
          </div>
        </a>
      </article>
    `
  }).join('')

  container.insertAdjacentHTML('beforeend', cards)
  initMasonry(container)

  const startIndex = (page - 1) * itemsPerPage + 1
  const endIndex   = Math.min(page * itemsPerPage, total)
  showingStart.value = total ? startIndex : 0
  showingEnd.value = total ? endIndex : 0
  totalItems.value = total
  currentPage.value = page
  totalPages.value = totalPagesServer

  buildPageNumbers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function buildPageNumbers() {
  const holder = $('#page-numbers')
  if (!holder) return
  holder.innerHTML = ''

  const pages = []
  const push = p => { if (!pages.includes(p) && p >= 1 && p <= totalPages.value) pages.push(p) }
  push(1); push(2)
  push(currentPage.value - 1); push(currentPage.value); push(currentPage.value + 1)
  push(totalPages.value - 1); push(totalPages.value)

  const uniqueSorted = [...new Set(pages)].sort((a,b)=>a-b)
  let prev = 0

  uniqueSorted.forEach(p => {
    if (p - prev > 1) {
      const dots = document.createElement('span')
      dots.className = 'px-2 text-gray-400 select-none'
      dots.textContent = '…'
      holder.appendChild(dots)
    }
    const btn = document.createElement('button')
    btn.className = `px-4 py-2 rounded-lg border transition-colors ${
      p === currentPage.value
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`
    btn.textContent = p
    btn.setAttribute('aria-current', p === currentPage.value ? 'page' : 'false')
    btn.addEventListener('click', () => gotoPage(p))
    holder.appendChild(btn)
    prev = p
  })

  const prevBtn = $('#prev-page')
  const nextBtn = $('#next-page')
  if (prevBtn) prevBtn.disabled = currentPage.value <= 1
  if (nextBtn) nextBtn.disabled = currentPage.value >= totalPages.value
}

function gotoPage(p, { pushState = true } = {}) {
  const page = Math.max(1, Math.min(p, totalPages.value))
  try {
    const data = getAlbums(page, itemsPerPage)
    totalPages.value = data.totalPages
    totalItems.value = data.total
    renderGallery(data.galleries, data.page, data.total, data.totalPages)
    if (pushState) {
      const url = new URL(location.href)
      url.searchParams.set('page', page)
      history.pushState({ page }, '', url)
      router.replace({ query: { page } })
    }
  } catch (err) {
    console.error('Failed to load gallery', err)
  }
}

function initMobileMenu() {
  const btn = $('#mobile-menu-btn')
  const menu = $('#mobile-menu')
  if (!btn || !menu) return
  btn.addEventListener('click', () => menu.classList.toggle('hidden'))
  if (menu) {
    $$('#mobile-menu a', menu).forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')))
  }
}

// Watch route query changes
watch(() => route.query.page, (newPage) => {
  const page = parseInt(newPage, 10) || 1
  if (page !== currentPage.value && page >= 1 && page <= totalPages.value) {
    gotoPage(page, { pushState: false })
  }
})

onMounted(() => {
  initMobileMenu()
  const pageFromUrl = parseInt(route.query.page, 10) || 1
  currentPage.value = pageFromUrl

  const data = getAlbums(currentPage.value, itemsPerPage)
  totalPages.value = data.totalPages
  totalItems.value = data.total
  renderGallery(data.galleries, data.page, data.total, data.totalPages)

  window.addEventListener('popstate', (e) => {
    const page = e.state?.page ?? parseInt(new URL(location.href).searchParams.get('page') || '1', 10)
    gotoPage(page, { pushState: false })
  })
})

onUnmounted(() => {
  if (msnry) {
    msnry.destroy()
    msnry = null
  }
})

function prevPage() {
  if (currentPage.value > 1) gotoPage(currentPage.value - 1)
}

function nextPage() {
  if (currentPage.value < totalPages.value) gotoPage(currentPage.value + 1)
}
</script>