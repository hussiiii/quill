import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  code: string
  language: string
  onRunQuery?: (query: string) => void
}

export function CodeBlock({ code, language, onRunQuery }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-300 font-mono">{language}</span>
        <div className="flex gap-2">
          {language === 'sql' && onRunQuery && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRunQuery(code)}
              className="h-6 px-2 text-xs"
            >
              Run Query
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            className="h-6 px-2 text-xs text-gray-300 hover:text-white"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-100 font-mono whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  )
}
