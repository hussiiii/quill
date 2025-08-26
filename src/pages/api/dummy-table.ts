import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client directly in this API file with service role key
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
interface DummyTableRow {
  id: number
  name: string
  description: string | null
  created_at?: string
  updated_at?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // Get all records from dummytable
        const { data: records, error: fetchError } = await supabaseAdmin
          .from('dummytable')
          .select('*')
          .order('id', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        return res.status(200).json({
          success: true,
          data: records,
          count: records?.length || 0
        })

      case 'POST':
        // Create a new record
        const { name, description } = req.body

        if (!name) {
          return res.status(400).json({
            success: false,
            error: 'Name is required'
          })
        }

        const { data: newRecord, error: insertError } = await supabaseAdmin
          .from('dummytable')
          .insert([{ name, description }])
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return res.status(201).json({
          success: true,
          data: newRecord
        })

      case 'DELETE':
        // Delete a record by ID
        const { id } = req.query

        if (!id) {
          return res.status(400).json({
            success: false,
            error: 'ID is required'
          })
        }

        const { error: deleteError } = await supabaseAdmin
          .from('dummytable')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw deleteError
        }

        return res.status(200).json({
          success: true,
          message: 'Record deleted successfully'
        })

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        })
    }
  } catch (error: any) {
    console.error('Database error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
