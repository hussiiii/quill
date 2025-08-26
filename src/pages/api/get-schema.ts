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
    // Simple approach: Try to analyze the dummytable structure
    const tables: Record<string, any[]> = {}
    
    // Try to get a sample row from dummytable to understand its structure
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('dummytable')
      .select('*')
      .limit(1)
    
    if (!sampleError && sampleData) {
      if (sampleData.length > 0) {
        // We have data, so we can infer the structure
        tables['dummytable'] = Object.keys(sampleData[0]).map((key, index) => ({
          name: key,
          type: key === 'id' ? 'integer' : 'text',
          nullable: key !== 'id' && key !== 'name',
          default: key === 'id' ? 'auto-increment' : null,
          position: index + 1
        }))
      } else {
        // Table exists but is empty, use known structure
        tables['dummytable'] = [
          { name: 'id', type: 'integer', nullable: false, default: 'auto-increment', position: 1 },
          { name: 'name', type: 'text', nullable: false, default: null, position: 2 },
          { name: 'description', type: 'text', nullable: true, default: null, position: 3 }
        ]
      }
    } else {
      // Fallback if we can't access the table
      tables['dummytable'] = [
        { name: 'id', type: 'integer', nullable: false, default: 'auto-increment', position: 1 },
        { name: 'name', type: 'text', nullable: false, default: null, position: 2 },
        { name: 'description', type: 'text', nullable: true, default: null, position: 3 }
      ]
    }

    // Create a comprehensive schema description for the AI
    const schemaDescription = Object.entries(tables).map(([tableName, columns]) => {
      const columnDescriptions = columns.map(col => 
        `  - ${col.name} (${col.type}${col.nullable ? ', nullable' : ', not null'}${col.default ? `, ${col.default}` : ''})`
      ).join('\n')
      
      return `Table: ${tableName}\n${columnDescriptions}`
    }).join('\n\n')

    // Add some example queries to help the AI
    const enhancedSchema = `${schemaDescription}

Example queries you can suggest:
- SELECT * FROM dummytable;
- SELECT * FROM dummytable WHERE name = 'some_value';
- INSERT INTO dummytable (name, description) VALUES ('new_name', 'new_description');
- UPDATE dummytable SET name = 'updated_name' WHERE id = 1;
- DELETE FROM dummytable WHERE id = 1;

The user has a PostgreSQL database accessed through Supabase. Always use lowercase 'dummytable' (not 'DummyTable') in your queries.`

    return res.status(200).json({
      success: true,
      data: {
        tables,
        schemaDescription: enhancedSchema
      }
    })

  } catch (error: any) {
    console.error('Schema error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch schema'
    })
  }
}
