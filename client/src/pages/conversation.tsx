import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Send, Mic, MicOff, Sparkles, Loader2, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import type { Message, Conversation } from "@shared/schema";

export default function ConversationPage() {
  const [matchApp, paramsApp] = useRoute("/app/conversation/:id");
  const [matchLegacy, paramsLegacy] = useRoute("/conversation/:id");
  const params = paramsApp || paramsLegacy;
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [progress, setProgress] = useState(10);
  const [currentSection, setCurrentSection] = useState("Problem Statement");

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please allow microphone access.",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    return new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve(new Blob());
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const handleVoiceInput = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob.size === 0) return;

      setIsTranscribing(true);
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const response = await fetch("/api/speech-to-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64 }),
        });

        if (!response.ok) throw new Error("Failed to transcribe");

        const data = await response.json();
        setInput(data.transcript);
      } catch (error) {
        console.error("Error transcribing:", error);
        toast({
          variant: "destructive",
          title: "Transcription Error",
          description: "Could not transcribe audio. Please try again.",
        });
      } finally {
        setIsTranscribing(false);
      }
    } else {
      await startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const playMessageAudio = async (messageId: number, text: string) => {
    if (isPlayingAudio === messageId) return;
    
    setIsPlayingAudio(messageId);
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.substring(0, 500), voice: "nova" }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const data = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.onended = () => setIsPlayingAudio(null);
      audio.onerror = () => {
        console.error("Audio playback error");
        setIsPlayingAudio(null);
      };
      audio.play().catch(() => setIsPlayingAudio(null));
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(null);
    }
  };

  const conversationId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error("Failed to load conversation");
      
      const data = await response.json();
      setConversation(data);
      setMessages(data.messages || []);
      setCurrentSection(data.currentSection || "Problem Statement");
      
      // Get project to sync progress
      const projectResponse = await fetch(`/api/projects/${data.projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProgress(projectData.progress || 10);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now(),
      conversationId,
      role: "user",
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Add typing indicator
    const typingMsg: Message = {
      id: Date.now() + 1,
      conversationId,
      role: "ai",
      content: "",
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let aiResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              aiResponse += data.content;
              // Update AI message in real-time
              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.role === "ai") {
                  lastMsg.content = aiResponse;
                }
                return updated;
              });
            }

            if (data.done) {
              // Update progress and section if provided
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              if (data.section) {
                setCurrentSection(data.section);
              }
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              console.error("Stream error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
      // Remove typing indicator on error
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to send, regular Enter for new line
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!conversation) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <Button onClick={() => setLocation("/app")}>Go to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
             <Button 
               variant="outline" 
               size="sm" 
               onClick={async () => {
                 // Generate PRD and navigate to view
                 try {
                   const response = await fetch(`/api/projects/${conversation.projectId}/generate-prd`, {
                     method: "POST",
                   });
                   if (response.ok) {
                     setLocation(`/app/prd/${conversation.projectId}`);
                   }
                 } catch (error) {
                   console.error("Error generating PRD:", error);
                 }
               }}
               data-testid="button-view-draft"
             >
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
                data-testid={`message-${msg.id}`}
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
                    {msg.content ? (
                      msg.role === "ai" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({ ...props }) => <li {...props} />,
                            strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
                            em: ({ ...props }) => <em className="italic" {...props} />,
                            code: ({ ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )
                    ) : (
                      <div className="flex gap-1 items-center h-6">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === "ai" && msg.content && (
                      <button
                        onClick={() => playMessageAudio(msg.id, msg.content || "")}
                        className={`text-muted-foreground hover:text-primary transition-colors ${isPlayingAudio === msg.id ? "text-primary animate-pulse" : ""}`}
                        disabled={isPlayingAudio !== null}
                        data-testid={`button-play-${msg.id}`}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
                className={`rounded-lg h-10 w-10 shrink-0 ${isRecording ? "text-red-500 bg-red-500/10 animate-pulse" : isTranscribing ? "text-primary" : "text-muted-foreground"}`}
                onClick={handleVoiceInput}
                disabled={isSending || isTranscribing}
                data-testid="button-voice"
              >
                {isTranscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[44px] py-2.5 text-sm md:text-base outline-none"
                rows={1}
                disabled={isSending}
                data-testid="input-message"
              />
              
              <Button 
                size="icon" 
                className="rounded-lg h-10 w-10 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                data-testid="button-send"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Idea Foundry can make mistakes. Review generated PRDs.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
