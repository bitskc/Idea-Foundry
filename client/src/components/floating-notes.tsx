import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, X, Save, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingNotesProps {
  projectId: number;
  initialNotes: string;
  onNotesUpdate?: (notes: string) => void;
}

export default function FloatingNotes({ projectId, initialNotes, onNotesUpdate }: FloatingNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error("Failed to save notes");
      toast({ title: "Notes saved" });
      onNotesUpdate?.(notes);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 md:right-8 z-50 w-80 md:w-96 glass-panel rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
            data-testid="floating-notes-panel"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50">
              <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
                <Sparkles className="w-4 h-4 text-primary" />
                Quick Notes
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-muted/80 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 bg-card/30">
              <Textarea
                placeholder="Jot down thoughts, questions, insights..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[160px] resize-none mb-4 text-sm bg-background/50 border-border/50 focus-visible:ring-primary/50 shadow-inner rounded-xl p-3"
                data-testid="floating-notes-input"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  onClick={saveNotes}
                  disabled={isSaving}
                  className="rounded-lg font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all"
                  data-testid="floating-notes-save"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 md:right-8 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
          size="icon"
          data-testid="floating-notes-button"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <StickyNote className="w-6 h-6" />
          )}
        </Button>
      </motion.div>
    </>
  );
}
