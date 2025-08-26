import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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
    const { messages, schema, currentQuery } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      })
    }

    // Log the schema and current query for debugging
    console.log('Schema being sent to AI:', schema ? schema.substring(0, 200) + '...' : 'No schema')
    console.log('Current SQL query:', currentQuery || 'No current query')

    // System prompt with database and current query context
    const systemPrompt = `You are a helpful SQL database assistant. You help users write SQL queries and understand their database.

Database Schema:
${schema || 'No schema information available'}

Current SQL Query in Editor:
${currentQuery ? `\`\`\`sql\n${currentQuery}\n\`\`\`` : 'No query currently in the editor'}

Guidelines:
1. When writing SQL queries, always wrap them in markdown code blocks with sql language specification
2. Be helpful and explain your reasoning
3. For complex queries, break down the explanation step by step
4. Always consider the user's database schema when suggesting queries
5. If a user asks about their data, refer to the actual table and column names from the schema
6. Be conversational and friendly
7. When showing SQL code, make it properly formatted and readable
8. IMPORTANT: If the user asks for "all rows" or "all data", use the specific table names from the schema above
9. Always suggest specific queries based on the actual tables that exist in their database
10. **CRITICAL**: When providing SQL code, use REAL values, not placeholders:
    - ✅ Good: UPDATE dummytable SET name = 'John' WHERE id = 1;
    - ❌ Bad: UPDATE dummytable SET column_name = 'value' WHERE condition;
    - Use actual column names from the schema (id, name, description)
    - Use realistic example values ('John Doe', 'Sample description', etc.)
    - Make queries executable without user editing
11. **CONTEXT AWARENESS**: You can see what the user is currently working on in their SQL editor. Use this context to:
    - Offer suggestions to improve their current query
    - Help debug issues with their current SQL
    - Suggest next steps or variations of their current query
    - Answer questions about what their current query does
    - Provide specific help based on what they're writing

Current conversation context: The user is working with a PostgreSQL database through Supabase. You can see their current SQL query above.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    return res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        usage: completion.usage
      }
    })

  } catch (error: any) {
    console.error('Chat error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat'
    })
  }
}
