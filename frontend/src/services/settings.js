import { apiFetch } from './api.js'

export async function getVolunteeringSettings() {
  try {
    console.log('Fetching volunteering settings...')
    const data = await apiFetch('/api/public/settings/volunteering')
    console.log('Settings API response:', data)
    return data
  } catch (error) {
    console.error('Error fetching volunteering settings:', error)
    throw error
  }
}
