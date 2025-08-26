import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  InfoIcon, 
  DatabaseIcon, 
  BrainCircuitIcon, 
  MessageSquareIcon, 
  PlayIcon, 
  CopyIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  AlertTriangleIcon
} from "lucide-react";

export function HowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          👉👉👉CLICK ME👈👈👈
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SparklesIcon className="h-5 w-5" />
            SQL Editor with AI - Architecture & Features
          </DialogTitle>
          <DialogDescription>
            Complete overview of how this application works and the decisions behind it
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BrainCircuitIcon className="h-5 w-5" />
              Core Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4" />
                    1. SQL Editor & Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Monaco Editor with PostgreSQL execution via Supabase. Direct SQL execution using custom database function.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BrainCircuitIcon className="h-4 w-4" />
                    2. AI Schema Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI has full database schema awareness (table structure, not data) for intelligent suggestions.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquareIcon className="h-4 w-4" />
                    3. AI Chat Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Conversational AI with SQL editor context. Chat history maintained for continuous conversation.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PlayIcon className="h-4 w-4" />
                    4. Interactive Code Blocks
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI-generated SQL includes Run Query and Copy buttons with syntax highlighting and validation.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4" />
                    5. Query Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI uses real schema data to prevent hallucinated fields/tables. Placeholder detection prevents invalid execution.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    6. AI Autocomplete
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Copilot-style inline suggestions using Monaco's completion API. Context-aware SQL completions.
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Architecture Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🏗️ Architecture Decisions</h3>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Database Access Pattern</h4>
                <p className="text-sm text-muted-foreground">
                  Uses Supabase service role key for server-side database access. RLS disabled for simplicity. 
                  Direct SQL execution via custom PostgreSQL function <code className="bg-muted px-1 rounded">execute_sql</code>.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Component Architecture</h4>
                <p className="text-sm text-muted-foreground">
                  Monolithic approach - everything in main page component for rapid MVP development. 
                  API routes handle Supabase and OpenAI interactions separately.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">AI Integration</h4>
                <p className="text-sm text-muted-foreground">
                  OpenAI GPT-4o-mini for chat and autocomplete. Real-time schema context injection. 
                  Monaco Editor's native inline completion API for Copilot-style suggestions.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Considerations Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Production Considerations
            </h3>
            
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">Security:</span> Using service role key with RLS disabled. For production, implement proper authentication and row-level security.
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">Code Structure:</span> Components not split for rapid MVP development. Also used 'any' type a lot, etc.
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">SQL Execution Safety:</span> Direct SQL execution without sandboxing. For production, consider Docker isolation or query sanitization.
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">API Costs:</span> ~$7 OpenAI credits available for testing. Autocomplete and chat usage should be monitored in production.
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">Autocomplete Robustness:</span> Basic autocomplete implementation. Could be enhanced with caching, better error handling, and offline fallbacks.
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-medium text-foreground">UI Polish:</span> Quick MVP styling with some rough edges. Padding, margins, and element overlapping issues need refinement for production readiness.
                </div>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Tech Stack */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🛠️ Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Next.js</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Monaco Editor</Badge>
              <Badge variant="secondary">Supabase</Badge>
              <Badge variant="secondary">PostgreSQL</Badge>
              <Badge variant="secondary">OpenAI GPT-4o-mini</Badge>
              <Badge variant="secondary">SHADCN UI</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">Lucide Icons</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
