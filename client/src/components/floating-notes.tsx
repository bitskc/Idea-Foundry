import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

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
      await api.patch(`/api/projects/${projectId}`, { notes });
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-[calc(100vw-3rem)] max-w-80 bg-card border rounded-xl shadow-xl"
            data-testid="floating-notes-panel"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="w-4 h-4 text-primary" />
                Quick Notes
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3">
              <Textarea
                placeholder="Jot down thoughts, questions, insights..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] resize-none mb-3 text-sm"
                data-testid="floating-notes-input"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  onClick={saveNotes}
                  disabled={isSaving}
                  data-testid="floating-notes-save"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        data-testid="floating-notes-button"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <StickyNote className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}
