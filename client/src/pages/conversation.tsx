import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Send, Mic, Pause, Play, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
};

export default function Conversation() {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Mock Conversation State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi there! I'm VibePlan. I'm here to help you flesh out your product idea into a full specification. To get started, what's the core problem you're trying to solve?",
      timestamp: new Date()
    }
  ]);
  
  const [progress, setProgress] = useState(10);
  const [currentSection, setCurrentSection] = useState("Problem Statement");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const [step, setStep] = useState(0);
  
  const questions = [
    {
      text: "That's a great starting point. Who do you see as the primary user for this solution? Is it more for individuals or businesses?",
      section: "Target Audience",
      progress: 25
    },
    {
      text: "Understood. How do you plan to monetize this? Subscription, one-time purchase, or something else?",
      section: "Monetization",
      progress: 50
    },
    {
      text: "Got it. Do you have any specific technical requirements or stack preferences (e.g., React, Python, Mobile App)?",
      section: "Technical Specs",
      progress: 75
    },
    {
      text: "Thanks for sharing. I'm generating your initial PRD draft now based on these details. Click 'View Draft' to see the result!",
      section: "Finalizing",
      progress: 100
    }
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");
    
    // Simulate AI thinking and response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: "typing",
        role: "ai",
        content: "...",
        timestamp: new Date(),
        isTyping: true
      }]);

      setTimeout(() => {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== "typing");
          const nextQuestion = questions[step];
          
          if (!nextQuestion) {
             return [...filtered];
          }

          return [...filtered, {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: nextQuestion.text,
            timestamp: new Date()
          }];
        });
        
        if (step < questions.length) {
          const nextQ = questions[step];
          if (nextQ) {
            setProgress(nextQ.progress);
            setCurrentSection(nextQ.section);
          }
          setStep(prev => prev + 1);
        }
      }, 1500);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen md:h-[calc(100vh-theme(spacing.0))] bg-background">
        {/* Header / Progress */}
        <div className="border-b bg-card/50 backdrop-blur p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col gap-1 w-full max-w-md">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>{currentSection}</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex gap-2 ml-4">
             <Button variant="outline" size="sm" onClick={() => setLocation("/prd/1")}>
                View Draft
             </Button>
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 md:p-8" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className={`w-8 h-8 md:w-10 md:h-10 border ${msg.role === "ai" ? "bg-primary/10 border-primary/20" : "bg-muted"}`}>
                  {msg.role === "ai" ? (
                    <AvatarFallback className="text-primary"><Sparkles className="w-4 h-4" /></AvatarFallback>
                  ) : (
                    <AvatarFallback>You</AvatarFallback>
                  )}
                </Avatar>

                <div className={`flex flex-col gap-1 max-w-[80%] md:max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`
                    p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm
                    ${msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border border-border rounded-tl-sm"}
                  `}>
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center h-6">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
               <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-lg h-10 w-10 shrink-0 ${isRecording ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground"}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[44px] py-2.5 text-sm md:text-base"
                rows={1}
              />
              
              <Button 
                size="icon" 
                className="rounded-lg h-10 w-10 shrink-0"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              VibePlan can make mistakes. Review generated PRDs.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
