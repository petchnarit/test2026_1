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

    <!-- Header -->
    <section class="py-8 lg:py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="album-title" class="text-3xl sm:text-4xl font-bold text-gray-900 mb-0">Loading…</h2>
      </div>
    </section>

    <!-- Content -->
    <main class="py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Justified Grid container -->
        <div id="grid"></div>

        <!-- Empty -->
        <div id="empty" class="hidden text-center py-16">
          <p class="text-gray-500">ไม่พบรูปภาพในคอลเลกชันนี้</p>
        </div>

        <!-- Error -->
        <div id="error" class="hidden text-center py-16">
          <p class="text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p class="text-gray-500 mt-1" id="error-detail"></p>
        </div>
      </div>
    </main>

    <!-- Lightbox -->
    <div id="lightbox" class="fixed inset-0 z-[60] bg-black/90 hidden">
      <button id="lb-close" class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button id="lb-prev" class="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Previous">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button id="lb-next" class="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Next">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <!-- Download button -->
      <a id="lb-download"
        class="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        href="#"
        download
        aria-label="Download">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>

      <div class="w-full h-full flex items-center justify-center p-4">
        <img id="lb-img" src="" alt="" class="max-h-full max-w-full object-contain select-none" />
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Masonry from 'masonry-layout'
import imagesLoaded from 'imagesloaded'
import { getAlbumById } from '../data/gallery'

const route = useRoute()

// Configuration
const ROWS_PER_CHUNK = 8
const GAP = 8
const ALLOWED_WIDTHS = [320, 2048]
const EAGER_FIRST = 12
const PREFETCH_ROWS_AHEAD = 2
const LB_PRELOAD = 2

// State
let IMAGES = []
let DATA_CTX = null
let CUR = 0
let NEXT_IDX = 0
let rowBuffer = []
let io = null
let ro = null
let SENTINEL = null
let isLayingOut = false
let relayoutScheduled = false
let suppressRO = false
let ioCooldown = false
const IO_COOLDOWN_MS = 180
let lastContainerW = 0

// Helpers
const $  = (q, root=document) => root.querySelector(q)
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q))

function withParams(url, extra) {
  const u = new URL(url, location.origin)
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v)
  })
  return u.toString()
}

function parseAspect(aspectStr, fallback = 4/3) {
  if (!aspectStr) return fallback
  if (typeof aspectStr === 'number') return aspectStr
  const m = String(aspectStr).match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (!m) return fallback
  const w = parseFloat(m[1]), h = parseFloat(m[2])
  return h > 0 ? (w/h) : fallback
}

function getRowTargetHeight() {
  const cs = getComputedStyle(document.documentElement)
  const v = parseFloat(cs.getPropertyValue('--rowH') || '220')
  return Math.max(120, Math.min(320, v))
}

function ioRootMargin() {
  const h = getRowTargetHeight()
  const px = Math.round(PREFETCH_ROWS_AHEAD * h + Math.max(0, PREFETCH_ROWS_AHEAD - 1) * GAP)
  return `${px}px 0px`
}

// Layout
function requestLayoutSoon() {
  if (ioCooldown) return
  ioCooldown = true
  setTimeout(() => { ioCooldown = false; layoutNextRows(); }, IO_COOLDOWN_MS)
}

function layoutNextRows() {
  if (isLayingOut) return
  isLayingOut = true
  try {
    const grid = $('#grid')
    const containerW = Math.floor(grid.clientWidth || 0)
    if (!containerW) return
    lastContainerW = containerW

    if (NEXT_IDX >= IMAGES.length && rowBuffer.length === 0) {
      if (io && SENTINEL) io.unobserve(SENTINEL)
      return
    }

    const targetH = getRowTargetHeight()
    let rowsAdded = 0
    let workList = [...rowBuffer]
    rowBuffer = []

    while (NEXT_IDX < IMAGES.length || workList.length) {
      let row = []
      let aspectSum = 0

      while (workList.length) {
        const it = workList.shift()
        row.push(it)
        aspectSum += it.aspect
      }

      while (NEXT_IDX < IMAGES.length) {
        const img = IMAGES[NEXT_IDX]
        const aspect = parseAspect(img.aspectRatio, 4/3)
        row.push({ idx: NEXT_IDX, img, aspect })
        aspectSum += aspect
        NEXT_IDX++
        const totalWidth = aspectSum * targetH + GAP * (row.length - 1)
        if (totalWidth >= containerW * 0.98) break
        if (row.length >= 12) break
      }

      if (!row.length) break

      let rowH = targetH
      let scaled = false
      const canStretch = NEXT_IDX < IMAGES.length
      const rawW = aspectSum * targetH + GAP * (row.length - 1)

      if (!scaled && rawW < containerW * 0.7 && row.length >= 6 && canStretch) {
        const forceScale = (containerW - GAP * (row.length - 1)) / (aspectSum * targetH)
        rowH = Math.max(120, Math.min(360, Math.round(targetH * forceScale)))
        scaled = true
      }

      if (canStretch && !scaled && rawW !== containerW) {
        const scale = (containerW - GAP * (row.length - 1)) / (aspectSum * targetH)
        rowH = Math.max(120, Math.min(360, Math.round(targetH * scale)))
        scaled = true
      }

      const rowEl = document.createElement('div')
      rowEl.className = 'jg-row'
      rowEl.style.height = `${rowH}px`

      let widths = row.map(r => Math.round(r.aspect * rowH))
      let totalW = widths.reduce((a,b)=>a+b, 0) + GAP * (row.length - 1)
      let delta = containerW - totalW

      if (scaled && Math.abs(delta) <= row.length * 2) {
        for (let k = 0; delta !== 0 && k < widths.length; k++) {
          widths[k] += (delta > 0 ? 1 : -1)
          delta += (delta > 0 ? -1 : 1)
        }
      }

      row.forEach((r, i) => {
        const w = widths[i], h = rowH
        const item = document.createElement('figure')
        item.className = 'jg-item'
        item.style.width = `${w}px`
        item.style.height = `${h}px`

        // Local file URL - no API
        const baseFileUrl = `images/gallery/${r.img.filename}`
        const src320 = withParams(baseFileUrl, { w: ALLOWED_WIDTHS[0], q: 100 })
        const sizes = `${w}px`
        const alt = `${DATA_CTX.title || ''} - ${r.img.filename || ''}`.trim().replace(/"/g, '&quot;')

        item.innerHTML = `
          <picture>
            <source type="image/webp" srcset="${src320} 320w" sizes="${sizes}">
            <img
              data-index="${r.idx}"
              src="${src320}"
              srcset="${src320} 320w"
              sizes="${sizes}"
              alt="${alt}"
              loading="${r.idx < EAGER_FIRST ? 'eager' : 'lazy'}"
              decoding="async"
              fetchpriority="${r.idx < EAGER_FIRST ? 'high' : 'low'}"
            />
          </picture>
        `
        item.querySelector('img').addEventListener('click', (e) => {
          CUR = Number(e.currentTarget.dataset.index || 0)
          openLB(CUR, DATA_CTX)
        })
        rowEl.appendChild(item)
      })

      $('#grid').appendChild(rowEl)
      rowsAdded++

      if (rowsAdded >= ROWS_PER_CHUNK) break
      if (!scaled && NEXT_IDX < IMAGES.length) {
        rowBuffer = row.map(r => ({...r}))
        break
      } else {
        rowBuffer = []
      }
    }

    if (io && SENTINEL && NEXT_IDX >= IMAGES.length && rowBuffer.length === 0) {
      io.unobserve(SENTINEL)
    }
  } finally {
    isLayingOut = false
  }
}

// Infinite scroll
function setupInfiniteScroll() {
  if (SENTINEL) return
  SENTINEL = document.createElement('div')
  SENTINEL.id = 'sentinel'
  SENTINEL.className = 'h-8'
  $('#grid').after(SENTINEL)

  io = new IntersectionObserver((entries) => {
    if (entries.some(e=>e.isIntersecting)) {
      requestLayoutSoon()
    }
  }, { rootMargin: ioRootMargin() })
  io.observe(SENTINEL)
}

// Album rendering
function renderAlbum(data) {
  $('#album-title').textContent = data.title ?? '(Untitled)'
  const grid = $('#grid')
  grid.innerHTML = ''

  if (!data.images || data.images.length === 0) {
    $('#empty').classList.remove('hidden')
    return
  }
  $('#empty').classList.add('hidden')

  IMAGES = data.images
  DATA_CTX = data
  NEXT_IDX = 0
  rowBuffer = []

  layoutNextRows()
  setupInfiniteScroll()
}

// Lightbox
function getViewUrl(data, idx) {
  const img = IMAGES[idx]
  if (!img) return ''
  return `images/gallery/${img.filename}?w=${ALLOWED_WIDTHS[1]}&q=80`
}

function openLB(i, dataCtx) {
  const viewUrl = getViewUrl(dataCtx, i)
  const imgEl = $('#lb-img')
  if (imgEl) imgEl.src = viewUrl
  const a = $('#lb-download')
  if (a) {
    a.href = `images/gallery/${IMAGES[i]?.filename}`
    a.setAttribute('download', IMAGES[i]?.filename || 'photo')
  }
  $('#lightbox').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  preloadLB(i, dataCtx)
}

function closeLB() {
  $('#lightbox').classList.add('hidden')
  const el = $('#lb-img')
  if (el) el.src = ''
  document.body.style.overflow = ''
}

function nextLB(dir, dataCtx) {
  if (!IMAGES.length) return
  CUR = (CUR + dir + IMAGES.length) % IMAGES.length
  openLB(CUR, dataCtx)
}

function preloadLB(centerIdx, dataCtx) {
  if (!Number.isInteger(LB_PRELOAD) || LB_PRELOAD <= 0) return
  for (let d = 1; d <= LB_PRELOAD; d++) {
    const next = (centerIdx + d + IMAGES.length) % IMAGES.length
    const prev = (centerIdx - d + IMAGES.length) % IMAGES.length
    ;[next, prev].forEach((k) => {
      const u = getViewUrl(dataCtx, k)
      const img = new Image()
      img.decoding = 'async'
      img.loading = 'eager'
      img.referrerPolicy = 'no-referrer-when-downgrade'
      img.src = u
    })
  }
}

// Resize handling
function scheduleRelayout() {
  if (relayoutScheduled) return
  relayoutScheduled = true
  setTimeout(() => {
    relayoutScheduled = false
    suppressRO = true
    try {
      if (ro) ro.disconnect()
      if (io && SENTINEL) io.unobserve(SENTINEL)
      const savedIdx = CUR
      const data = DATA_CTX
      if (!data) return
      const grid = $('#grid')
      grid.innerHTML = ''
      NEXT_IDX = 0
      rowBuffer = []
      layoutNextRows()
      CUR = savedIdx
      if (!ro) {
        ro = new ResizeObserver(() => {
          if (suppressRO) return
          const w = Math.floor($('#grid').clientWidth || 0)
          if (!w || Math.abs(w - lastContainerW) < 4) return
          scheduleRelayout()
        })
      }
      ro.observe($('#grid'))
      if (SENTINEL && io) io.observe(SENTINEL)
    } finally {
      suppressRO = false
    }
  }, 120)
}

// Init
onMounted(() => {
  const id = route.params.id
  if (!id) {
    $('#error')?.classList.remove('hidden')
    $('#error-detail').textContent = 'ไม่พบค่า id จาก URL'
    return
  }

  const result = getAlbumById(id)
  if (!result.ok) {
    $('#error')?.classList.remove('hidden')
    $('#error-detail').textContent = 'Album not found'
    return
  }

  renderAlbum(result)

  $('#lb-close')?.addEventListener('click', closeLB)
  $('#lb-prev')?.addEventListener('click', ()=> nextLB(-1, result))
  $('#lb-next')?.addEventListener('click', ()=> nextLB(1,  result))
  $('#lightbox')?.addEventListener('click', (e)=> { if (e.target === e.currentTarget) closeLB(); })
  window.addEventListener('keydown', (e) => {
    const lb = $('#lightbox')
    if (lb.classList.contains('hidden')) return
    if (e.key === 'Escape') closeLB()
    if (e.key === 'ArrowRight') nextLB(1,  result)
    if (e.key === 'ArrowLeft')  nextLB(-1, result)
  })

  ro = new ResizeObserver(() => {
    if (suppressRO) return
    const w = Math.floor($('#grid').clientWidth || 0)
    if (!w || Math.abs(w - lastContainerW) < 4) return
    scheduleRelayout()
  })
  ro.observe($('#grid'))

  setupInfiniteScroll()
})

onUnmounted(() => {
  if (io) {
    io.disconnect()
    io = null
  }
  if (ro) {
    ro.disconnect()
    ro = null
  }
})
</script>