"use client";

import * as React from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Undo2,
} from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const BLOCKS = [
  { value: "p", label: "Paragraph" },
  { value: "1", label: "Heading 1 (page title — avoid)" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
  { value: "5", label: "Heading 5" },
  { value: "6", label: "Heading 6" },
] as const;

interface InternalLink {
  label: string;
  href: string;
}

/** Site URLs offered as suggestions in the link dialog (internal linking). */
function useInternalLinks() {
  const [links, setLinks] = React.useState<InternalLink[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    const statics: InternalLink[] = [
      { label: "Home", href: "/" },
      { label: "All cars", href: "/cars" },
      { label: "Blogs", href: "/blogs" },
      { label: "About Us", href: "/about-us" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact-us" },
    ];
    apiFetch<{ blogs: { slug: string }[]; cars: { slug: string }[]; landingPages?: { slug: string }[] }>("/seo/sitemap")
      .then((res) => {
        if (cancelled) return;
        setLinks([
          ...statics,
          ...(res.data.landingPages ?? []).map((p) => ({ label: `Landing: ${p.slug}`, href: `/${p.slug}` })),
          ...res.data.cars.map((c) => ({ label: `Car: ${c.slug}`, href: `/cars/${c.slug}` })),
          ...res.data.blogs.map((b) => ({ label: `Blog: ${b.slug}`, href: `/blogs/${b.slug}` })),
        ]);
      })
      .catch(() => !cancelled && setLinks(statics));
    return () => {
      cancelled = true;
    };
  }, []);
  return links;
}

/**
 * WYSIWYG editor for blogs, landing pages and content pages. Produces clean
 * HTML (headings, lists, links, images with alt text) that the backend
 * sanitises on save. "HTML" switches to raw source editing.
 */
export function RichTextEditor({
  value,
  onChange,
  folder,
  placeholder = "Start writing…",
  minHeight = 360,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Upload folder for inline images. */
  folder: string;
  placeholder?: string;
  minHeight?: number;
}) {
  const [sourceMode, setSourceMode] = React.useState(false);
  const lastEmitted = React.useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        // Internal links must stay "follow" and open in the same tab.
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } },
      }),
      ImageExtension.configure({ HTMLAttributes: { loading: "lazy" } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rte-content focus:outline-none px-4 py-3",
        style: `min-height:${minHeight}px`,
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? "" : e.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Keep the editor in sync when the value changes from outside (e.g. form reset, source mode).
  React.useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white focus-within:ring-2 focus-within:ring-lime">
      {editor && <Toolbar editor={editor} folder={folder} sourceMode={sourceMode} onToggleSource={() => setSourceMode((s) => !s)} />}
      {sourceMode ? (
        <textarea
          className="block w-full resize-y px-4 py-3 font-mono text-xs leading-relaxed text-navy-800 outline-none"
          style={{ minHeight }}
          value={value}
          onChange={(e) => {
            lastEmitted.current = "";
            onChange(e.target.value);
          }}
          aria-label="HTML source"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function Toolbar({
  editor,
  folder,
  sourceMode,
  onToggleSource,
}: {
  editor: Editor;
  folder: string;
  sourceMode: boolean;
  onToggleSource: () => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: ([1, 2, 3, 4, 5, 6] as const).find((l) => e.isActive("heading", { level: l }))?.toString() ?? "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      linkHref: (e.getAttributes("link").href as string | undefined) ?? "",
      image: e.isActive("image"),
      imageAlt: (e.getAttributes("image").alt as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const disabled = sourceMode;

  const setBlock = (v: string) => {
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  };

  const insertImage = async (file: File) => {
    if (!ACCEPTED.includes(file.type) || file.size > MAX_SIZE) {
      toast({ title: "Unsupported image", description: "JPG, PNG or WEBP up to 5MB.", variant: "error" });
      return;
    }
    const alt = window.prompt("Alt text for this image (describe what it shows):", "")?.trim();
    if (alt === undefined) return;
    if (!alt) {
      toast({ title: "Alt text required", description: "Describe the image so search engines and screen readers understand it.", variant: "error" });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await apiFetch<{ url: string }>("/admin/upload", { method: "POST", body: form });
      editor.chain().focus().setImage({ src: res.data.url, alt }).run();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof ApiClientError ? err.message : "Please try again.", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const editAlt = () => {
    const alt = window.prompt("Alt text for the selected image:", state.imageAlt);
    if (alt === null) return;
    editor.chain().focus().updateAttributes("image", { alt: alt.trim() }).run();
  };

  return (
    <div className="relative border-b border-navy-100 bg-navy-50/60">
      <div className="flex flex-wrap items-center gap-1 p-1.5">
        <label className="sr-only" htmlFor="rte-block">
          Block type
        </label>
        <select
          id="rte-block"
          className="h-8 rounded-lg border border-navy-200 bg-white px-2 text-xs font-semibold text-navy-700 disabled:opacity-50"
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
          disabled={disabled}
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <Sep />
        <ToolButton label="Bold" active={state.bold} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} />
        <ToolButton label="Italic" active={state.italic} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} />
        <ToolButton label="Strikethrough" active={state.strike} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()} icon={Strikethrough} />
        <Sep />
        <ToolButton label="Bullet list" active={state.bullet} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} />
        <ToolButton label="Numbered list" active={state.ordered} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} />
        <ToolButton label="Quote" active={state.quote} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote} />
        <ToolButton label="Divider" disabled={disabled} onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} />
        <Sep />
        <ToolButton label="Add or edit link" active={state.link} disabled={disabled} onClick={() => setLinkOpen((o) => !o)} icon={Link2} />
        <ToolButton label="Remove link" disabled={disabled || !state.link} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()} icon={Link2Off} />
        <ToolButton
          label="Insert image"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          icon={uploading ? Loader2 : ImagePlus}
          spin={uploading}
        />
        {state.image && !disabled && (
          <button
            type="button"
            onClick={editAlt}
            className="flex h-8 items-center gap-1 rounded-lg bg-white px-2 text-xs font-semibold text-brand-deep ring-1 ring-navy-200 hover:bg-lime/10"
          >
            <Type className="size-3.5" /> Alt: {state.imageAlt ? `“${state.imageAlt.slice(0, 24)}${state.imageAlt.length > 24 ? "…" : ""}”` : "missing — add"}
          </button>
        )}
        <Sep />
        <ToolButton label="Undo" disabled={disabled || !state.canUndo} onClick={() => editor.chain().focus().undo().run()} icon={Undo2} />
        <ToolButton label="Redo" disabled={disabled || !state.canRedo} onClick={() => editor.chain().focus().redo().run()} icon={Redo2} />
        <div className="ml-auto">
          <ToolButton label={sourceMode ? "Back to editor" : "Edit HTML source"} active={sourceMode} onClick={onToggleSource} icon={Code2} text="HTML" />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) insertImage(f);
            e.target.value = "";
          }}
        />
      </div>
      {linkOpen && !disabled && <LinkPanel editor={editor} currentHref={state.linkHref} onClose={() => setLinkOpen(false)} />}
    </div>
  );
}

function LinkPanel({ editor, currentHref, onClose }: { editor: Editor; currentHref: string; onClose: () => void }) {
  const links = useInternalLinks();
  const [href, setHref] = React.useState(currentHref);
  const [newTab, setNewTab] = React.useState(false);
  const listId = React.useId();

  const apply = () => {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!value) {
      chain.unsetLink().run();
    } else {
      const external = /^https?:\/\//i.test(value);
      chain
        .setLink({
          href: value,
          target: newTab ? "_blank" : null,
          rel: newTab || external ? "noopener" : null,
        })
        .run();
    }
    onClose();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 bg-white p-2">
      <input
        autoFocus
        list={listId}
        className="h-9 min-w-0 flex-1 rounded-lg border border-navy-200 px-3 text-sm outline-none focus:ring-2 focus:ring-lime"
        placeholder="/cars/hyundai-creta or https://…"
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") onClose();
        }}
        aria-label="Link URL"
      />
      <datalist id={listId}>
        {links.map((l) => (
          <option key={l.href} value={l.href}>
            {l.label}
          </option>
        ))}
      </datalist>
      <label className="flex items-center gap-1.5 text-xs text-navy-600">
        <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} /> New tab
      </label>
      <button type="button" onClick={apply} className="h-9 rounded-lg bg-navy-900 px-3 text-xs font-semibold text-white">
        Apply
      </button>
      <button type="button" onClick={onClose} className="h-9 rounded-lg px-2 text-xs font-semibold text-navy-500">
        Cancel
      </button>
      <p className="w-full text-[11px] text-navy-400">Start typing to pick one of your own pages — internal links help SEO.</p>
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  onClick,
  active,
  disabled,
  spin,
  text,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  spin?: boolean;
  text?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-navy-600 transition-colors hover:bg-white hover:text-navy-900 disabled:pointer-events-none disabled:opacity-40",
        active && "bg-navy-900 text-white hover:bg-navy-800 hover:text-white",
      )}
    >
      <Icon className={cn("size-4", spin && "animate-spin")} />
      {text && <span className="text-xs font-semibold">{text}</span>}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-navy-200" aria-hidden />;
}
