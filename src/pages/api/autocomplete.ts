import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Autocomplete API called:', req.method);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  try {
    const { partialQuery, cursorPosition, schema } = req.body
    console.log('Autocomplete request:', { partialQuery, cursorPosition, hasSchema: !!schema });

    if (!partialQuery) {
      return res.status(400).json({
        success: false,
        error: 'Partial query is required'
      })
    }

    // Let AI handle all suggestions dynamically

    // Create context for AI completion
    const systemPrompt = `You are an AI-powered SQL autocomplete engine that provides intelligent inline suggestions like GitHub Copilot.

Database Schema:
${schema || 'No schema available'}

Your job is to predict what the user wants to type next and provide a SINGLE inline completion.

Rules:
1. Return ONLY the completion text that should appear after the user's current input
2. Provide smart, context-aware completions based on SQL patterns and the database schema
3. For incomplete queries, suggest the most likely complete SQL statement
4. Keep suggestions practical and executable
5. Don't include the user's existing text, only what comes next
6. Use proper SQL syntax and formatting
7. Focus on common SQL patterns (SELECT, INSERT, UPDATE, DELETE)

Examples:
- User types "SELECT" → suggest " * FROM dummytable;"
- User types "SELECT * FROM" → suggest " dummytable;"
- User types "INSERT" → suggest " INTO dummytable (name, description) VALUES ('', '');"
- User types "UPDATE dummytable SET" → suggest " name = '' WHERE id = ;"
- User types "DELETE" → suggest " FROM dummytable WHERE id = ;"

Be intelligent and context-aware. Predict the most useful completion.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Partial query: "${partialQuery}"\nCursor position: ${cursorPosition}\n\nWhat should I suggest for completion?` }
      ],
      temperature: 0.1, // Low temperature for consistent suggestions
      max_tokens: 100,
    })

    const suggestion = completion.choices[0]?.message?.content?.trim()
    
    if (!suggestion) {
      return res.status(200).json({
        success: true,
        suggestion: ''
      })
    }

    // Clean up the suggestion
    let cleanSuggestion = suggestion
      .replace(/^["\-\*]+/, '') // Remove leading quotes, dashes, asterisks (but keep spaces)
      .replace(/["\s]*$/, '') // Remove trailing quotes and spaces
      .trim()

    // Ensure the suggestion doesn't repeat the user's input
    if (cleanSuggestion.toLowerCase().startsWith(partialQuery.toLowerCase())) {
      cleanSuggestion = cleanSuggestion.substring(partialQuery.length)
    }

    // Ensure suggestion starts with a space (for proper word separation)
    if (cleanSuggestion && !cleanSuggestion.startsWith(' ')) {
      cleanSuggestion = ' ' + cleanSuggestion
    }

    console.log('Final AI suggestion:', JSON.stringify(cleanSuggestion));

    return res.status(200).json({
      success: true,
      suggestion: cleanSuggestion
    })

  } catch (error: any) {
    console.error('Autocomplete error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate autocomplete'
    })
  }
}
