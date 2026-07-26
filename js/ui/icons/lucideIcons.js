import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  AudioLines,
  Captions,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clapperboard,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Grid3X3,
  Home,
  Hourglass,
  Info,
  KeyRound,
  Library,
  Link,
  ListVideo,
  LogOut,
  Mic,
  MonitorSmartphone,
  MoreHorizontal,
  Palette,
  Pause,
  Play,
  Plug,
  Plus,
  Puzzle,
  QrCode,
  RefreshCw,
  RotateCw,
  Scan,
  Search,
  Settings,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Tags,
  Terminal,
  Trash2,
  User,
  Users,
  Wrench,
  X
} from "lucide";

const ICONS = {
  arrow_downward: ArrowDown,
  arrow_back: ArrowLeft,
  arrow_upward: ArrowUp,
  audio: AudioLines,
  back: ChevronLeft,
  build: Wrench,
  captions: Captions,
  check: Check,
  check_circle: CircleCheck,
  chevron: ChevronRight,
  chevron_down: ChevronDown,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  content_discovery: Compass,
  episodes: ListVideo,
  explore: Compass,
  external: ExternalLink,
  eye: Eye,
  eye_off: EyeOff,
  grid_view: Grid3X3,
  home: Home,
  hourglass_top: Hourglass,
  info: Info,
  integration: Link,
  library: Library,
  link: Link,
  logout: LogOut,
  mic: Mic,
  more: MoreHorizontal,
  palette: Palette,
  pause: Pause,
  person: User,
  people: Users,
  phone: Smartphone,
  phone_android: Smartphone,
  play: Play,
  playback: Clapperboard,
  plugins: Puzzle,
  plus: Plus,
  qr: QrCode,
  qr_code_2: QrCode,
  refresh: RefreshCw,
  scan: Scan,
  search: Search,
  settings: Settings,
  skip_next: SkipForward,
  source: Plug,
  speed: Gauge,
  streams: Tags,
  style: Tags,
  sync: RotateCw,
  terminal: Terminal,
  trash: Trash2,
  tune: SlidersHorizontal,
  vpn_key: KeyRound,
  web_device: MonitorSmartphone
};

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderNode([tagName, attributes = {}]) {
  const attrs = Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(" ");
  return `<${tagName}${attrs ? ` ${attrs}` : ""}></${tagName}>`;
}

export function renderLucideIcon(name, className = "lucide-icon") {
  const icon = ICONS[String(name || "").trim()] || Settings;
  const classes = Array.from(
    new Set(
      `${String(className || "")} lucide-icon`
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    )
  ).join(" ");
  return `
    <svg class="${escapeAttribute(classes)}"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true"
         focusable="false">
      ${icon.map(renderNode).join("")}
    </svg>
  `;
}

function upgradeMaterialIcon(node) {
  if (!(node instanceof Element) || !node.classList.contains("material-icons")) {
    return;
  }
  const iconName = String(node.textContent || "").trim();
  if (!iconName) {
    return;
  }
  node.innerHTML = renderLucideIcon(iconName, "lucide-icon");
  node.dataset.lucideIcon = iconName;
}

export function upgradeLucideIcons(root = document) {
  if (root instanceof Element && root.classList.contains("material-icons")) {
    upgradeMaterialIcon(root);
  }
  root.querySelectorAll?.(".material-icons")?.forEach(upgradeMaterialIcon);
}

export function installLucideIconObserver() {
  upgradeLucideIcons(document);
  if (typeof MutationObserver !== "function") {
    return () => {};
  }
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          upgradeLucideIcons(node);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
