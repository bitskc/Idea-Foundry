import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Send, Mic, MicOff, Sparkles, Loader2, Volume2, ArrowLeft, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const supportedType = preferredTypes.find(
        (type) =>
          typeof MediaRecorder !== "undefined" &&
          typeof MediaRecorder.isTypeSupported === "function" &&
          MediaRecorder.isTypeSupported(type),
      );
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

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
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
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
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!conversation) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <Button onClick={() => setLocation("/app")}>Go to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-background">
        {/* Header / Progress */}
        <div className="border-b bg-background/80 backdrop-blur-xl p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation(`/app/ideas/${conversation.projectId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col gap-1 w-[200px] sm:w-[300px] md:w-[400px]">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="truncate mr-2">{currentSection}</span>
                <span className="shrink-0 text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-muted overflow-hidden" />
            </div>
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
               className="font-semibold border-primary/20 hover:bg-primary/5 text-primary transition-all hidden sm:flex"
               data-testid="button-view-draft"
             >
                <FileText className="w-4 h-4 mr-2" />
                View PRD Draft
             </Button>
             <Button 
               variant="outline" 
               size="icon" 
               onClick={async () => {
                 try {
                   const response = await fetch(`/api/projects/${conversation.projectId}/generate-prd`, { method: "POST" });
                   if (response.ok) setLocation(`/app/prd/${conversation.projectId}`);
                 } catch (error) {
                   console.error("Error generating PRD:", error);
                 }
               }}
               className="sm:hidden border-primary/20 text-primary"
             >
               <FileText className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 md:p-8" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-8 pb-4 pt-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  data-testid={`message-${msg.id}`}
                >
                  <Avatar className={`w-8 h-8 md:w-10 md:h-10 border shadow-sm ${msg.role === "ai" ? "bg-gradient-to-br from-primary to-orange-400 border-primary/20" : "bg-muted border-border"}`}>
                    {msg.role === "ai" ? (
                      <AvatarFallback className="bg-transparent text-white"><Sparkles className="w-4 h-4" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="font-semibold">You</AvatarFallback>
                    )}
                  </Avatar>

                  <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`
                      p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm
                      ${msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-card border border-border rounded-tl-sm text-card-foreground"}
                    `}>
                      {msg.content ? (
                        msg.role === "ai" ? (
                          <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground max-w-none">
                            <ReactMarkdown
                              components={{
                                p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                ul: ({ ...props }) => <ul className="list-disc pl-4 mb-4 space-y-1.5" {...props} />,
                                ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-4 space-y-1.5" {...props} />,
                                li: ({ ...props }) => <li {...props} />,
                                strong: ({ ...props }) => <strong className="font-bold text-foreground" {...props} />,
                                em: ({ ...props }) => <em className="italic" {...props} />,
                                code: ({ className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return match ? (
                                    <code className="block bg-muted/50 p-3 rounded-lg text-sm border font-mono whitespace-pre-wrap" {...props}>{children}</code>
                                  ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border" {...props}>{children}</code>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )
                      ) : (
                        <div className="flex gap-1.5 items-center h-6 px-2">
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === "ai" && msg.content && (
                        <button
                          onClick={() => playMessageAudio(msg.id, msg.content || "")}
                          className={`text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted ${isPlayingAudio === msg.id ? "text-primary animate-pulse bg-primary/5" : ""}`}
                          disabled={isPlayingAudio !== null}
                          data-testid={`button-play-${msg.id}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-card border-2 rounded-2xl p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
               <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-xl h-12 w-12 shrink-0 transition-colors ${isRecording ? "text-red-500 bg-red-500/10 animate-pulse hover:bg-red-500/20" : isTranscribing ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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
                placeholder="Type your answer... (Ctrl+Enter to send)"
                className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[48px] py-3 px-2 text-base outline-none text-foreground placeholder:text-muted-foreground"
                rows={1}
                disabled={isSending}
                data-testid="input-message"
              />
              
              <Button 
                size="icon" 
                className="rounded-xl h-12 w-12 shrink-0 shadow-sm"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                data-testid="button-send"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3 font-medium">
              Idea Foundry can make mistakes. Review generated specs carefully.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}