"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrderNotes } from "@/lib/stores/notes";
import { cn, sanitizeNoteHtml } from "@/lib/utils";

export function NotesEditorDialog({
  orderId,
  initialHtml,
  open,
  onOpenChange,
}: {
  orderId: string;
  initialHtml: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setNote = useOrderNotes((state) => state.setNote);
  const [characters, setCharacters] = React.useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: sanitizeNoteHtml(initialHtml),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap prose-note px-3 py-3",
        "aria-label": "Production notes rich text editor",
      },
    },
    onUpdate: ({ editor: instance }) => {
      setCharacters(instance.getText().length);
    },
    onCreate: ({ editor: instance }) => {
      setCharacters(instance.getText().length);
    },
  });

  const save = () => {
    if (!editor) return;
    const clean = DOMPurify.sanitize(editor.getHTML(), {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "ul",
        "ol",
        "li",
        "h2",
        "h3",
        "blockquote",
      ],
      ALLOWED_ATTR: [],
    });
    setNote(orderId, clean);
    toast.success("Production note saved", {
      description: "Stored in this browser only, after HTML sanitisation.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle>Production notes</DialogTitle>
              <DialogDescription>
                Inline QC observations, rework notes and handover context for {orderId}.
              </DialogDescription>
            </div>
            <Badge tone="brand" className="mt-0.5 shrink-0">
              Tiptap · lazy loaded
            </Badge>
          </div>
        </DialogHeader>
        <div className="px-5 pb-4">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-raised px-1.5 py-1">
              <ToolbarButton
                label="Bold"
                active={editor?.isActive("bold")}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold />
              </ToolbarButton>
              <ToolbarButton
                label="Italic"
                active={editor?.isActive("italic")}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic />
              </ToolbarButton>
              <ToolbarButton
                label="Heading"
                active={editor?.isActive("heading", { level: 2 })}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-line" />
              <ToolbarButton
                label="Bullet list"
                active={editor?.isActive("bulletList")}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List />
              </ToolbarButton>
              <ToolbarButton
                label="Numbered list"
                active={editor?.isActive("orderedList")}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered />
              </ToolbarButton>
              <span className="mx-1 h-4 w-px bg-line" />
              <ToolbarButton
                label="Undo"
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor?.can().undo()}
              >
                <Undo2 />
              </ToolbarButton>
              <ToolbarButton
                label="Redo"
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor?.can().redo()}
              >
                <Redo2 />
              </ToolbarButton>
              <span className="ml-auto pr-1 text-[10px] text-faint">
                {characters} characters
              </span>
            </div>
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="h-40 animate-pulse bg-raised" />
            )}
          </div>
          <p className="mt-2 text-[10px] text-faint">
            Saved HTML is whitelisted before it is written to localStorage. The editor bundle is
            only fetched when this dialog opens.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!editor}>
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-muted outline-none transition-colors hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-40 [&_svg]:size-3.5",
        active && "bg-ink text-surface hover:bg-ink hover:text-surface",
      )}
    >
      {children}
    </button>
  );
}
