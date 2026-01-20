import { apiFetch } from './api.js'

export async function getMenus() {
  try {
    const data = await apiFetch('/api/public/menus')
    return data.items || []
  } catch (error) {
    console.error('Error fetching menus:', error)
    throw error
  }
}

export async function getMenuItems(menuName) {
  try {
    const data = await apiFetch(`/api/public/menus/${menuName}`)
    return data || { items: [] }
  } catch (error) {
    console.error(`Error fetching menu ${menuName}:`, error)
    return { items: [] }
  }
}
