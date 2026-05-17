import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjqynkjwpmhyxhrqamjh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzIyMjMsImV4cCI6MjA5NDUwODIyM30.Xjk8RR6V56EXTX7JrAf-6DQ-1Z0m-qa0lgC9pyHB7Zw'

export const supabase = createClient(supabaseUrl, supabaseKey)