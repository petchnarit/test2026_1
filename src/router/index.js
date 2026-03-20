import { createRouter, createWebHashHistory } from 'vue-router'
import GalleryView from '../views/GalleryView.vue'
import AlbumView from '../views/AlbumView.vue'

const routes = [
  {
    path: '/',
    name: 'Gallery',
    component: GalleryView
  },
  {
    path: '/view/:id',
    name: 'Album',
    component: AlbumView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
