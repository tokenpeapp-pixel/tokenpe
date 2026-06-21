import { supabase } from '../../lib/supabase'
import FindClient from './FindClient'

export const metadata = {
  title: 'Find a Clinic Near You — TokenPe',
  description: 'Search for clinics by specialty, city, or doctor name. Join their WhatsApp queue from home — no physical visit needed to get your token.',
  openGraph: {
    title: 'Find a Clinic — TokenPe',
    description: 'Discover OPD clinics near you and join their WhatsApp queue instantly.',
    url: 'https://tokenpe.online/find',
    siteName: 'TokenPe',
    images: [{ url: 'https://tokenpe.online/og-image.png', width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
}

export default async function FindPage({ searchParams }) {
  const params = await searchParams
  const q = params?.q || ''
  const city = params?.city || ''
  const specialty = params?.specialty || ''

  // Fetch initial data server-side for SEO / fast first paint
  let query = supabase
    .from('public_clinics')
    .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count')
    .limit(60)

  if (q) {
    query = query.or(`name.ilike.%${q}%,specialty.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`)
  }
  if (city) query = query.ilike('city', `%${city}%`)
  if (specialty) query = query.ilike('specialty', `%${specialty}%`)

  const [
    { data: initialClinics },
    { data: citiesData },
    { data: specialtiesData }
  ] = await Promise.all([
    query,
    supabase.from('public_clinics').select('city').not('city', 'is', null),
    supabase.from('public_clinics').select('specialty').not('specialty', 'is', null)
  ])

  const cities = [...new Set((citiesData || []).map(r => r.city).filter(Boolean))].sort()
  const specialties = [...new Set((specialtiesData || []).map(r => r.specialty).filter(Boolean))].sort()

  return (
    <FindClient
      initialClinics={initialClinics || []}
      initialQ={q}
      initialCity={city}
      initialSpecialty={specialty}
      cities={cities}
      specialties={specialties}
    />
  )
}
