"use client";
import { useState, useEffect, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card'; // Example for message bubbles
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Loader2 } from 'lucide-react'; // Icons
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"; // If using standard page layout
import { Separator } from "@/components/ui/separator";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'error';
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => { // Session ID management
    let storedSessionId = localStorage.getItem('chatSessionId');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('chatSessionId', storedSessionId);
    }
    setSessionId(storedSessionId);
    // TODO: Optionally load initial chat history here if an API for it existed
    // For now, we only persist session_id to keep context with backend if it stores history by session_id
  }, []);

  useEffect(() => { // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault(); // Prevent default form submission if event is provided
    if (!currentMessage.trim() || isLoading || !sessionId) return;

    const userMessageText = currentMessage;
    // Add user message to UI optimistically
    setMessages(prev => [...prev, { type: 'user', text: userMessageText, id: Date.now().toString() }]);
    setCurrentMessage(''); // Clear input field
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', { // This is the Next.js API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The Next.js route /api/chat will pass this to the Python backend
        // It includes session_id for context, and potentially history if implemented
        body: JSON.stringify({ message: userMessageText, session_id: sessionId }),
      });

      // The /api/chat/route.ts directly returns the Python API's response:
      // { success: bool, response: str, session_id: str, timestamp: str } or { error: str }
      const result = await response.json();

      if (!response.ok || result.error || (result.success !== undefined && !result.success)) {
        const errorMsg = result.error || (result.data ? result.data.response : 'Failed to get response from AI.');
        throw new Error(errorMsg);
      }
      // Assuming result directly contains the Python API's response structure
      // (as per current /api/chat/route.ts which passes through Python response)
      setMessages(prev => [...prev, { type: 'ai', text: result.response, id: Date.now().toString() + 'ai' }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { type: 'error', text: `Error: ${error.message}`, id: Date.now().toString() + 'err' }]);
      toast({ title: "Chat Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarInset className="bg-dark-bg flex flex-col h-screen"> {/* Ensure full height */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-neon-blue" />
          <h1 className="text-lg font-semibold text-white">Chat with MIA</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg">
        {messages.map(msg => (
          <Card key={msg.id} className={`max-w-xl p-3 rounded-lg ${
            msg.type === 'user' ? 'ml-auto bg-neon-blue/20 border-neon-blue/50 text-white' :
            msg.type === 'ai' ? 'mr-auto bg-dark-card border-dark-border text-white' :
            'mr-auto bg-red-500/20 border-red-500/50 text-red-200' // Error message styling
          }`}>
            <p className="text-white whitespace-pre-wrap">{msg.text}</p>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && <div className="p-4 text-center text-gray-400 text-sm flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin mr-2"/>MIA is thinking...</div>}

      <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-border bg-dark-card/50">
        <div className="flex items-center gap-2">
          <Input
            value={currentMessage}
            onChange={e => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-dark-bg border-dark-border text-white focus:border-neon-blue"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline on Enter
                handleSendMessage();
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !currentMessage.trim()} className="bg-neon-blue hover:bg-neon-blue/80 text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </SidebarInset>
  );
}
