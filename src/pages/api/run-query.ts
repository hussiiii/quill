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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      })
    }

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query cannot be empty'
      })
    }

    // Execute raw SQL using the database function
    let result: any = null
    let rowCount = 0
    let message = 'Query executed successfully'
    
    try {
      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        query_text: trimmedQuery
      })

      if (error) {
        throw error
      }

      // Handle the response based on query type
      const queryLower = trimmedQuery.toLowerCase().trim()
      result = data

      if (queryLower.startsWith('select')) {
        // For SELECT queries, data should be an array
        result = data || []
        rowCount = Array.isArray(data) ? data.length : 0
        message = `Query returned ${rowCount} row(s)`
      } else {
        // For INSERT/UPDATE/DELETE, data contains rowsAffected
        if (data && typeof data === 'object' && 'rowsAffected' in data) {
          rowCount = data.rowsAffected || 0
          result = { rowsAffected: rowCount }
          
          if (queryLower.startsWith('insert')) {
            message = `Inserted ${rowCount} row(s) successfully`
          } else if (queryLower.startsWith('update')) {
            message = `Updated ${rowCount} row(s) successfully`
          } else if (queryLower.startsWith('delete')) {
            message = `Deleted ${rowCount} row(s) successfully`
          } else {
            message = `Query executed successfully, ${rowCount} row(s) affected`
          }
        } else {
          // Fallback for other operations
          result = data
          message = 'Query executed successfully'
        }
      }
    } catch (rpcError: any) {
      // Provide helpful error message if the function doesn't exist
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        throw new Error(
          'Database function not found. Please create the execute_sql function in your Supabase database. Check the console for the SQL to run.'
        )
      }
      throw rpcError
    }

    return res.status(200).json({
      success: true,
      data: result,
      rowCount: rowCount,
      query: trimmedQuery,
      message: message,
      executedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Query execution error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute query'
    })
  }
}
