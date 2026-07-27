import { supabase } from '../../../lib/supabase'
import RRedirectClient from './RRedirectClient'

export async function generateMetadata({ params }) {
  const { code } = await params
  const { data: restaurant } = await supabase
    .from('public_restaurants')
    .select('name, specialty, city')
    .eq('code', code)
    .single()

  if (!restaurant) {
    return { title: 'Restaurant Not Found | TokenPe' }
  }

  return {
    title: `Join waitlist for ${restaurant.name} | TokenPe`,
    description: `Get your live token for ${restaurant.name}${restaurant.city ? ` in ${restaurant.city}` : ''} via TokenPe.`
  }
}

export default async function RestaurantRedirectPage({ params }) {
  const { code } = await params
  
  // Fetch basic public info
  const { data: restaurant, error } = await supabase
    .from('public_restaurants')
    .select('name, code, specialty, city')
    .eq('code', code)
    .single()

  return <RRedirectClient restaurant={restaurant || null} code={code} />
}
