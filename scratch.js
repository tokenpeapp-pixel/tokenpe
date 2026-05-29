import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjqynkjwpmhyxhrqamjh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzIyMjMsImV4cCI6MjA5NDUwODIyM30.Xjk8RR6V56EXTX7JrAf-6DQ-1Z0m-qa0lgC9pyHB7Zw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getCols() {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .limit(1)
  
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]))
  } else {
    console.log(error)
  }
}

getCols()
