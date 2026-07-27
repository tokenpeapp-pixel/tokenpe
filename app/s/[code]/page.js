import { supabase } from '../../../lib/supabase'
import SRedirectClient from './SRedirectClient'

export async function generateMetadata({ params }) {
  const { code } = await params
  const { data: salon } = await supabase
    .from('public_salons')
    .select('name, specialty, city')
    .eq('code', code.toUpperCase())
    .single()

  const salonName = salon?.name || 'Salon'
  return {
    title: `Join ${salonName} Queue — TokenPe`,
    description: `Join the WhatsApp queue for ${salonName} via TokenPe. No app needed.`,
  }
}

export default async function SPage({ params }) {
  const { code } = await params
  const upperCode = code.toUpperCase()

  const { data: salon } = await supabase
    .from('public_salons')
    .select('name, specialty, city, area, code')
    .eq('code', upperCode)
    .single()

  return <SRedirectClient salon={salon} code={upperCode} />
}
