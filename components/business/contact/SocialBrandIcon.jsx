import {
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

function XBrandIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75h-6.657l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function TelegramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M21.7 3.4 18.5 19c-.2 1.1-.8 1.4-1.7.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.1 12.8 1.2 11.3c-1-.3-1-1 .2-1.5L20.5 2.5c.9-.3 1.6.2 1.2.9Z" />
    </svg>
  );
}

function WhatsAppIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2 22l5.4-1.4A10 10 0 1 0 12 2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.3 0-.5.1-.6l.4-.5.2-.5c.1-.2 0-.4 0-.5L9.5 7.5c-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1 0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

const ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: XBrandIcon,
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
};

export default function SocialBrandIcon({
  platform,
  size = 19,
  ...props
}) {
  const Icon = ICONS[platform];

  if (!Icon) {
    return null;
  }

  return (
    <Icon
      width={size}
      height={size}
      {...props}
    />
  );
}
