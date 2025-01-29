require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

interface Bucket {
  id: string
  name: string
  owner: string
  created_at: string
  updated_at: string
  public: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadVenueImages() {
  try {
    // Create venues bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
    
    if (bucketsError) throw bucketsError

    const venuesBucket = buckets.find((b: Bucket) => b.name === 'venues')
    if (!venuesBucket) {
      const { error: createError } = await supabase
        .storage
        .createBucket('venues', { public: true })
      
      if (createError) throw createError
      console.log('Created venues bucket')
    }

    // Get list of venue images
    const venuesDir = path.join(process.cwd(), 'public', 'images', 'venues')
    const files = fs.readdirSync(venuesDir)
    
    // Upload each image
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        const filePath = path.join(venuesDir, file)
        const fileBuffer = fs.readFileSync(filePath)
        
        const { error: uploadError } = await supabase
          .storage
          .from('venues')
          .upload(file, fileBuffer, {
            contentType: file.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
            upsert: true
          })

        if (uploadError) {
          console.error(`Error uploading ${file}:`, uploadError)
        } else {
          console.log(`Successfully uploaded ${file}`)
        }
      }
    }

    console.log('Finished uploading venue images')
  } catch (error) {
    console.error('Error:', error)
  }
}

uploadVenueImages() 