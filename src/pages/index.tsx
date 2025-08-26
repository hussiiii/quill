import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CodeBlock } from "@/components/CodeBlock";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Chat message type
interface ChatMessage {
  id: number;
  type: "user" | "ai";
  message: string;
}

// Initial chat messages
const initialChatMessages: ChatMessage[] = [
  {
    id: 1,
    type: "ai",
    message: "Hello! I'm your SQL assistant. I can help you write queries, understand your database schema, and analyze your data. What would you like to know?",
  },
];

// Types for the real data
interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface TableData {
  rows: any[];
  columns: TableColumn[];
  rowCount: number;
}

const initialQuery = `SELECT
  id,
  name,
  description
FROM public.dummytable
ORDER BY id ASC;`;

export default function Home() {
  const [query, setQuery] = useState(initialQuery);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatInput, setChatInput] = useState("");
  const [tableData, setTableData] = useState<TableData>({ rows: [], columns: [], rowCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [databaseSchema, setDatabaseSchema] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Fetch real data from the database
  const fetchTableData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/get-table-data');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setTableData(result.data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch database schema
  const fetchDatabaseSchema = async () => {
    try {
      console.log('Fetching database schema...');
      const response = await fetch('/api/get-schema');
      const result = await response.json();
      console.log('Schema fetch result:', result);
      if (result.success) {
        setDatabaseSchema(result.data.schemaDescription);
        console.log('Schema set:', result.data.schemaDescription.substring(0, 200) + '...');
      } else {
        console.error('Schema fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // AI Inline Suggestions (like Copilot)
  const setupAIInlineSuggestions = (editor: any, monaco: any) => {
    console.log('Setting up AI inline suggestions...');
    
    let debounceTimer: NodeJS.Timeout | null = null;
    let inlineSuggestionsProvider: any = null;
    
    // Function to get AI suggestion
    const getAISuggestion = async (currentText: string) => {
      try {
        if (!currentText.trim()) {
          console.log('Skipping AI suggestion - no text');
          return null;
        }
        
        console.log('Getting AI suggestion for:', currentText);
        
        const response = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partialQuery: currentText,
            cursorPosition: currentText.length,
            schema: databaseSchema,
          }),
        });

        const result = await response.json();
        console.log('AI suggestion result:', result);
        
        if (result.success && result.suggestion) {
          return result.suggestion;
        }
        return null;
      } catch (error) {
        console.error('Error getting AI suggestion:', error);
        return null;
      }
    };
    
    // Register Monaco's inline suggestions provider
    inlineSuggestionsProvider = monaco.languages.registerInlineCompletionsProvider('sql', {
      provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
        try {
          const currentText = model.getValue();
          console.log('Monaco inline completion triggered for:', currentText);
          
          if (!currentText.trim()) {
            return { items: [] };
          }
          
          const suggestion = await getAISuggestion(currentText);
          
          if (!suggestion) {
            console.log('No suggestion returned');
            return { items: [] };
          }
          
          console.log('Returning Monaco inline suggestion:', suggestion);
          
          return {
            items: [{
              insertText: suggestion,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              )
            }]
          };
        } catch (error) {
          console.error('Error in inline suggestions provider:', error);
          return { items: [] };
        }
      },
      freeInlineCompletions: (completions: any) => {
        // Cleanup if needed
      }
    });
    
    // Trigger inline suggestions on content change
    editor.onDidChangeModelContent(() => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Debounce and trigger inline suggestions
      debounceTimer = setTimeout(() => {
        console.log('Triggering inline suggestions...');
        editor.trigger('api', 'editor.action.inlineSuggest.trigger', {});
      }, 800); // Wait 800ms after user stops typing
    });
    
    // Manual trigger with Ctrl+Space
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      console.log('Manual inline suggestion trigger');
      editor.trigger('api', 'editor.action.inlineSuggest.trigger', {});
    });
  };

  // Load data and schema on component mount
  useEffect(() => {
    fetchTableData();
    fetchDatabaseSchema();
  }, []);

  // Execute SQL query
  const executeQuery = async () => {
    try {
      setQueryLoading(true);
      setQueryError(null);
      setQueryResult(null);
      
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Set error state instead of throwing
        setQueryError(result.error || 'Failed to execute query');
        return; // Exit early, don't continue processing
      }
      
      setQueryResult(result);
      
      // If it was a SELECT query, update the table data
      if (query.trim().toLowerCase().startsWith('select')) {
        if (result.data && Array.isArray(result.data)) {
          const columns = result.data.length > 0 
            ? Object.keys(result.data[0]).map(key => ({ name: key, type: 'unknown', nullable: true }))
            : [];
          
          setTableData({
            rows: result.data,
            columns: columns,
            rowCount: result.rowCount || result.data.length
          });
        }
      } else {
        // For INSERT/UPDATE/DELETE queries, refresh the table data
        await fetchTableData();
      }
      
    } catch (err: any) {
      // Handle network errors and other unexpected issues
      setQueryError(err.message || 'An unexpected error occurred while executing the query');
      console.error('Error executing query:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: "user",
      message: chatInput,
    };
    
    // Add user message immediately
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      // Prepare messages for OpenAI (exclude IDs, just content)
      const openAIMessages = [...chatMessages, userMessage].map(msg => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.message
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: openAIMessages,
          schema: databaseSchema,
          currentQuery: query // Add current SQL editor content
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI response');
      }
      
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: "ai",
        message: result.data.message,
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: "ai",
        message: "Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly.",
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setChatLoading(false);
    }
  };

  // Function to run SQL query from AI chat
  const runQueryFromChat = (queryText: string) => {
    setQuery(queryText);
    // Auto-execute the query
    setTimeout(() => {
      executeQuery();
    }, 100);
  };

  // Function to render message content with code blocks
  const renderMessageContent = (message: string, isAI: boolean) => {
    if (!isAI) {
      return <p className="text-sm">{message}</p>;
    }

    // Split message by code blocks
    const parts = message.split(/(```[\s\S]*?```)/g);
    
    return (
      <div className="text-sm">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            // Extract language and code
            const lines = part.slice(3, -3).trim().split('\n');
            const language = lines[0] || 'text';
            const code = lines.slice(1).join('\n');
            
            return (
              <CodeBlock
                key={index}
                code={code}
                language={language}
                onRunQuery={language === 'sql' ? runQueryFromChat : undefined}
              />
            );
          } else {
            // Regular text
            return part.split('\n').map((line, lineIndex) => (
              <p key={`${index}-${lineIndex}`} className={lineIndex > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ));
          }
        })}
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        .ghost-text {
          color: #999 !important;
          opacity: 0.6;
          font-style: italic;
        }
      `}</style>
      <div className="flex h-screen bg-background">

      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* Main Content */}
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            {/* SQL Editor */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">SQL Editor</h3>
                    <HowItWorksModal />
                  </div>
                </div>
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={query}
                    onChange={(value) => setQuery(value || "")}
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      setupAIInlineSuggestions(editor, monaco);
                    }}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      // Enable inline suggestions (like GitHub Copilot)
                      inlineSuggest: {
                        enabled: true,
                      },
                      // Disable regular autocomplete to focus on inline suggestions
                      quickSuggestions: false,
                      wordBasedSuggestions: "off",
                      // Ensure Tab accepts inline suggestions
                      tabCompletion: "off", // We'll handle Tab manually for inline suggestions
                      acceptSuggestionOnEnter: "off",
                    }}
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button 
                      onClick={executeQuery} 
                      disabled={queryLoading || !query.trim()}
                    >
                      {queryLoading ? 'Running...' : 'Run query'}
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Results Panel */}
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="flex flex-col h-full border-t">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {/* Query execution messages - same style as row count */}
                      {queryError && (
                        <span className="text-red-600">
                          Error: {queryError}
                        </span>
                      )}
                      
                      {queryResult && (
                        <span>
                          {queryResult.message}
                          {queryResult.executedAt && (
                            <span className="text-muted-foreground ml-2">
                              • 
                            </span>
                          )}
                        </span>
                      )}
                      
                      {/* Row count information - inline with messages */}
                      <span>
                        {loading ? "Loading..." : error ? "Error loading data" : `${tableData.rowCount} rows returned`}
                      </span>
                    </div>
                    
                    {error && (
                      <Button variant="outline" size="sm" onClick={fetchTableData}>
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {error ? (
                    <div className="p-4 text-center text-red-500">
                      <p>Error: {error}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure your .env.local file is configured with Supabase credentials
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableData.columns.map((column) => (
                            <TableHead key={column.name}>
                              {column.name}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={tableData.columns.length} className="text-center py-8">
                              Loading data...
                            </TableCell>
                          </TableRow>
                        ) : tableData.rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={tableData.columns.length} className="text-center py-8 text-muted-foreground">
                              No data found. Try creating some records first.
                            </TableCell>
                          </TableRow>
                        ) : (
                          tableData.rows.map((row, index) => (
                            <TableRow key={row.id || index}>
                              {tableData.columns.map((column) => (
                                <TableCell 
                                  key={column.name}
                                  className={column.name === 'id' ? "font-mono text-xs" : ""}
                                >
                                  {row[column.name] !== null ? String(row[column.name]) : ''}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* AI Chat Sidebar */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <div className="flex flex-col h-full border-l">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 break-words ${
                        message.type === "user" 
                          ? "bg-primary text-primary-foreground ml-auto" 
                          : "bg-muted"
                      }`}>
                        {renderMessageContent(message.message, message.type === "ai")}
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                          <p className="text-sm">AI is thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Spacer to ensure last message isn't cut off */}
                  <div className="h-4"></div>
                  
                  {/* Invisible element to scroll to */}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your database, request SQL queries, or get help..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={chatLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="sm"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? "..." : "Send"}
                </Button>
              </div>
            </div>
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
    </>
  );
}
