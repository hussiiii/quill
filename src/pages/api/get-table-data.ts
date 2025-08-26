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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  try {
    // Get all data from dummytable
    const { data: tableData, error: dataError } = await supabaseAdmin
      .from('dummytable')
      .select('*')
      .order('id', { ascending: true })

    if (dataError) {
      throw dataError
    }

    // Extract column names from the first row of data
    // This is a simpler approach that works with Supabase
    let columns: Array<{ name: string; type: string; nullable: boolean }> = []
    
    if (tableData && tableData.length > 0) {
      // Get column names from the first row
      columns = Object.keys(tableData[0]).map(key => ({
        name: key,
        type: 'unknown', // We can't easily get types through Supabase REST API
        nullable: true
      }))
    } else {
      // If no data, provide the expected column structure for dummytable
      columns = [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true }
      ]
    }

    return res.status(200).json({
      success: true,
      data: {
        rows: tableData || [],
        columns: columns,
        rowCount: tableData?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Database error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch table data'
    })
  }
}
