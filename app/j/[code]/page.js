import { supabase } from '../../../lib/supabase'
import JRedirectClient from './JRedirectClient'

export async function generateMetadata({ params }) {
  const { code } = await params
  const { data: clinic } = await supabase
    .from('public_clinics')
    .select('name, specialty, city')
    .eq('code', code.toUpperCase())
    .single()

  const clinicName = clinic?.name || 'Clinic'
  return {
    title: `Join ${clinicName} Queue — TokenPe`,
    description: `Join the WhatsApp OPD queue for ${clinicName} via TokenPe. No app needed.`,
  }
}

export default async function JPage({ params }) {
  const { code } = await params
  const upperCode = code.toUpperCase()

  const { data: clinic } = await supabase
    .from('public_clinics')
    .select('name, specialty, city, area, code')
    .eq('code', upperCode)
    .single()

  return <JRedirectClient clinic={clinic} code={upperCode} />
}
