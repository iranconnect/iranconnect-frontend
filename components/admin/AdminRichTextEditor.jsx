import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
  BackgroundColor,
  Color,
  FontFamily,
  FontSize,
  TextStyle,
} from "@tiptap/extension-text-style";

import apiClient from "../../utils/apiClient";

const MAX_EDITOR_IMAGE_SIZE_BYTES =
  2 * 1024 * 1024;

const EDITOR_IMAGE_TYPES_BY_EXTENSION =
  new Map([
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".png", "image/png"],
    [".webp", "image/webp"],
  ]);

const EDITOR_IMAGE_TYPE_ALIASES =
  new Map([
    ["image/jpg", "image/jpeg"],
    ["image/pjpeg", "image/jpeg"],
    ["image/x-png", "image/png"],
  ]);

function getNormalizedEditorImageType(
  file
) {
  const fileName =
    typeof file?.name === "string"
      ? file.name
      : "";

  const extensionMatch =
    fileName
      .toLowerCase()
      .match(/\.[^.]+$/);

  const extension =
    extensionMatch?.[0] || "";

  const expectedType =
    EDITOR_IMAGE_TYPES_BY_EXTENSION.get(
      extension
    );

  if (!expectedType) {
    return null;
  }

  const reportedType =
    typeof file?.type === "string"
      ? file.type.toLowerCase()
      : "";

  const normalizedReportedType =
    EDITOR_IMAGE_TYPE_ALIASES.get(
      reportedType
    ) ||
    reportedType;

  /*
   * Some browsers provide an empty or generic MIME type.
   * The backend still validates the real file signature.
   */
  if (
    !normalizedReportedType ||
    normalizedReportedType ===
      "application/octet-stream"
  ) {
    return expectedType;
  }

  if (
    normalizedReportedType !==
    expectedType
  ) {
    return null;
  }

  return expectedType;
}

function normalizeEditorHtml(editor) {
  if (!editor || editor.isEmpty) {
    return "";
  }

  return editor.getHTML();
}

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  children,
  title,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={[
        "admin-rich-text-button",
        active
          ? "admin-rich-text-button-active"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export default function AdminRichTextEditor({
  value = "",
  onChange,
  placeholder = "Write content here...",
  minHeight = 250,
  enableImages = true,
  className = "",
}) {
  const imageInputRef = useRef(null);

  const [
    isUploadingImage,
    setIsUploadingImage,
  ] = useState(false);

  const [
    imageUploadError,
    setImageUploadError,
  ] = useState("");

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),

      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      Image.configure({
        allowBase64: false,
        inline: false,
      }),
    ],

    content: value || "",

    editorProps: {
      attributes: {
        class:
          "admin-rich-text-content prose max-w-none focus:outline-none",
        "aria-label": placeholder,
        "data-placeholder": placeholder,
      },
    },

    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(
        normalizeEditorHtml(currentEditor)
      );
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml =
      normalizeEditorHtml(editor);

    const nextHtml =
      typeof value === "string"
        ? value
        : "";

    if (currentHtml === nextHtml) {
      return;
    }

    editor.commands.setContent(
      nextHtml,
      {
        emitUpdate: false,
      }
    );
  }, [editor, value]);

  const toolbarState = useEditorState({
    editor,

    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return {
          canUndo: false,
          canRedo: false,
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          blockquote: false,
          codeBlock: false,
          link: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          alignJustify: false,
        };
      }

      return {
        canUndo:
          currentEditor
            .can()
            .chain()
            .focus()
            .undo()
            .run(),

        canRedo:
          currentEditor
            .can()
            .chain()
            .focus()
            .redo()
            .run(),

        bold:
          currentEditor.isActive("bold"),

        italic:
          currentEditor.isActive("italic"),

        underline:
          currentEditor.isActive("underline"),

        strike:
          currentEditor.isActive("strike"),

        blockquote:
          currentEditor.isActive(
            "blockquote"
          ),

        codeBlock:
          currentEditor.isActive(
            "codeBlock"
          ),

        link:
          currentEditor.isActive("link"),

        alignLeft:
          currentEditor.isActive({
            textAlign: "left",
          }),

        alignCenter:
          currentEditor.isActive({
            textAlign: "center",
          }),

        alignRight:
          currentEditor.isActive({
            textAlign: "right",
          }),

        alignJustify:
          currentEditor.isActive({
            textAlign: "justify",
          }),
      };
    },
  });

  if (!editor) {
    return (
      <div
        className={[
          "admin-rich-text-editor",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="admin-rich-text-loading"
          style={{ minHeight }}
        >
          Loading editor...
        </div>
      </div>
    );
  }

  function setLink() {
    const previousUrl =
      editor.getAttributes("link").href ||
      "";

    const url = window.prompt(
      "Enter the link URL:",
      previousUrl
    );

    if (url === null) {
      return;
    }

    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: normalizedUrl,
      })
      .run();
  }

  function openImagePicker() {
    if (
      !editor ||
      isUploadingImage
    ) {
      return;
    }

    setImageUploadError("");

    imageInputRef.current?.click();
  }

  async function handleImageSelection(
    event
  ) {
    const file =
      event.target.files?.[0];

    /*
     * Allow selecting the same file again
     * after a validation or upload failure.
     */
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    setImageUploadError("");

    const normalizedImageType =
      getNormalizedEditorImageType(file);

    if (!normalizedImageType) {
      setImageUploadError(
        "Only valid JPEG, PNG, and WebP files are allowed."
      );
      return;
    }

    if (
      !Number.isFinite(file.size) ||
      file.size <= 0 ||
      file.size >
        MAX_EDITOR_IMAGE_SIZE_BYTES
    ) {
      setImageUploadError(
        "The image must be 2 MB or smaller."
      );
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();

      const normalizedFile =
        file.type === normalizedImageType
          ? file
          : new File(
              [file],
              file.name,
              {
                type: normalizedImageType,
                lastModified:
                  file.lastModified,
              }
            );

      formData.append(
        "image",
        normalizedFile,
        normalizedFile.name
      );

      const response =
        await apiClient.post(
          "/admin/editor-images",
          formData
        );

      const uploadedUrl =
        response?.data?.url;

      if (
        typeof uploadedUrl !==
        "string"
      ) {
        throw new Error(
          "The upload response did not contain an image URL."
        );
      }

      const parsedUrl =
        new URL(uploadedUrl);

      if (
        parsedUrl.protocol !==
          "https:" ||
        parsedUrl.hostname !==
          "res.cloudinary.com"
      ) {
        throw new Error(
          "The upload response contained an invalid image URL."
        );
      }

      editor
        .chain()
        .focus()
        .setImage({
          src: parsedUrl.href,
        })
        .run();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Image upload failed.";

      setImageUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div
      className={[
        "admin-rich-text-editor",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="admin-rich-text-toolbar"
        role="toolbar"
        aria-label="Rich text formatting"
      >
        <select
          aria-label="Font family"
          defaultValue=""
          onChange={(event) => {
            const fontFamily =
              event.target.value;

            if (!fontFamily) {
              editor
                .chain()
                .focus()
                .unsetFontFamily()
                .run();
            } else {
              editor
                .chain()
                .focus()
                .setFontFamily(fontFamily)
                .run();
            }

            event.target.value = "";
          }}
        >
          <option value="">
            Font
          </option>
          <option value="Arial">
            Arial
          </option>
          <option value="Georgia">
            Georgia
          </option>
          <option value="monospace">
            Monospace
          </option>
        </select>

        <select
          aria-label="Font size"
          defaultValue=""
          onChange={(event) => {
            const fontSize =
              event.target.value;

            if (!fontSize) {
              editor
                .chain()
                .focus()
                .unsetFontSize()
                .run();
            } else {
              editor
                .chain()
                .focus()
                .setFontSize(fontSize)
                .run();
            }

            event.target.value = "";
          }}
        >
          <option value="">
            Size
          </option>
          <option value="12px">
            Small
          </option>
          <option value="16px">
            Normal
          </option>
          <option value="20px">
            Large
          </option>
          <option value="28px">
            Huge
          </option>
        </select>

        <ToolbarButton
          title="Bold"
          active={toolbarState.bold}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          B
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={toolbarState.italic}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          I
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={toolbarState.underline}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          U
        </ToolbarButton>

        <ToolbarButton
          title="Strikethrough"
          active={toolbarState.strike}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleStrike()
              .run()
          }
        >
          S
        </ToolbarButton>

        <input
          type="color"
          title="Text color"
          aria-label="Text color"
          onInput={(event) =>
            editor
              .chain()
              .focus()
              .setColor(
                event.currentTarget.value
              )
              .run()
          }
        />

        <input
          type="color"
          title="Background color"
          aria-label="Background color"
          onInput={(event) =>
            editor
              .chain()
              .focus()
              .setBackgroundColor(
                event.currentTarget.value
              )
              .run()
          }
        />

        <ToolbarButton
          title="Align left"
          active={toolbarState.alignLeft}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
        >
          Left
        </ToolbarButton>

        <ToolbarButton
          title="Align center"
          active={
            toolbarState.alignCenter
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("center")
              .run()
          }
        >
          Center
        </ToolbarButton>

        <ToolbarButton
          title="Align right"
          active={toolbarState.alignRight}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("right")
              .run()
          }
        >
          Right
        </ToolbarButton>

        <ToolbarButton
          title="Justify"
          active={
            toolbarState.alignJustify
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("justify")
              .run()
          }
        >
          Justify
        </ToolbarButton>

        <ToolbarButton
          title="Blockquote"
          active={toolbarState.blockquote}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        >
          Quote
        </ToolbarButton>

        <ToolbarButton
          title="Code block"
          active={toolbarState.codeBlock}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleCodeBlock()
              .run()
          }
        >
          Code
        </ToolbarButton>

        <ToolbarButton
          title="Link"
          active={toolbarState.link}
          onClick={setLink}
        >
          Link
        </ToolbarButton>

        {enableImages && (
          <ToolbarButton
            title={
              isUploadingImage
                ? "Uploading image"
                : "Upload image"
            }
            disabled={
              isUploadingImage
            }
            onClick={openImagePicker}
          >
            {isUploadingImage
              ? "Uploading..."
              : "Image"}
          </ToolbarButton>
        )}

        <ToolbarButton
          title="Clear formatting"
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .run()
          }
        >
          Clear
        </ToolbarButton>

        <ToolbarButton
          title="Undo"
          disabled={
            !toolbarState.canUndo
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
        >
          Undo
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          disabled={
            !toolbarState.canRedo
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
        >
          Redo
        </ToolbarButton>
      </div>

      {enableImages && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="admin-rich-text-file-input"
          tabIndex={-1}
          aria-hidden="true"
          onChange={
            handleImageSelection
          }
        />
      )}

      {imageUploadError && (
        <p
          className="admin-rich-text-upload-error"
          role="alert"
        >
          {imageUploadError}
        </p>
      )}

      <div
        className="admin-rich-text-surface"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
