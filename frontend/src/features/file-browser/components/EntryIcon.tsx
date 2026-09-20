import {
  Audio,
  CLang,
  Cplus,
  Csharp,
  Csv,
  Dart,
  Database,
  Document,
  Go,
  Image,
  Java,
  Js,
  Kotlin,
  Markdown,
  PDF,
  PHP,
  Python,
  Reactjs,
  Reactts,
  Ruby,
  Rust,
  Shell,
  Svelte,
  Swift,
  Text,
  TypeScript,
  Video,
  Vue,
  XML,
  Yaml,
  Zip,
  Folder,
  FolderOpen,
} from '@react-symbols/icons'
import type { ComponentProps, ComponentType } from 'react'
import type { EntryType } from '../types'
import { fileExtension } from '../utils/fileName'

interface EntryIconProps {
  className?: string
  hasChildren?: boolean
  name: string
  size?: number
  type: EntryType
}

type SvgIcon = ComponentType<ComponentProps<'svg'>>

const extensionIcons: Record<string, SvgIcon> = {
  '7z': Zip,
  aac: Audio,
  avi: Video,
  bmp: Image,
  c: CLang,
  cpp: Cplus,
  cs: Csharp,
  css: Text,
  csv: Csv,
  dart: Dart,
  db: Database,
  flac: Audio,
  gif: Image,
  go: Go,
  gz: Zip,
  html: XML,
  ini: Text,
  java: Java,
  jpeg: Image,
  jpg: Image,
  js: Js,
  jsx: Reactjs,
  json: Text,
  kt: Kotlin,
  log: Text,
  m4a: Audio,
  md: Markdown,
  mkv: Video,
  mov: Video,
  mp3: Audio,
  mp4: Video,
  mpeg: Video,
  ogg: Audio,
  pdf: PDF,
  php: PHP,
  png: Image,
  py: Python,
  rar: Zip,
  rb: Ruby,
  rtf: Text,
  rs: Rust,
  sh: Shell,
  sql: Database,
  svelte: Svelte,
  svg: Image,
  swift: Swift,
  tar: Zip,
  ts: TypeScript,
  tsx: Reactts,
  txt: Text,
  vue: Vue,
  wav: Audio,
  webm: Video,
  webp: Image,
  xml: XML,
  yaml: Yaml,
  yml: Yaml,
  zip: Zip,
}

const officeExtensions: Record<string, { badge: string; color: string }> = {
  doc: { badge: 'DOC', color: 'bg-blue-600' },
  docx: { badge: 'DOC', color: 'bg-blue-600' },
  odt: { badge: 'DOC', color: 'bg-blue-600' },
  ods: { badge: 'XLS', color: 'bg-emerald-600' },
  odp: { badge: 'PPT', color: 'bg-orange-600' },
  ppt: { badge: 'PPT', color: 'bg-orange-600' },
  pptx: { badge: 'PPT', color: 'bg-orange-600' },
  xls: { badge: 'XLS', color: 'bg-emerald-600' },
  xlsx: { badge: 'XLS', color: 'bg-emerald-600' },
}

export function EntryIcon({ className, hasChildren = false, name, size = 24, type }: EntryIconProps) {
  if (type === 'folder') {
    const FolderIcon = hasChildren ? FolderOpen : Folder

    return <FolderIcon aria-hidden="true" className={className} height={size} width={size} />
  }

  const extension = fileExtension(name)
  const officeIcon = extension === null ? undefined : officeExtensions[extension]

  if (officeIcon !== undefined) {
    return (
      <span
        aria-hidden="true"
        className={`relative inline-grid shrink-0 place-items-center ${className ?? ''}`}
        style={{ height: size, width: size }}
      >
        <Document height={size} width={size} />
        <span className={`absolute -bottom-0.5 rounded px-0.5 text-[6px] font-bold leading-3 text-white ${officeIcon.color}`}>
          {officeIcon.badge}
        </span>
      </span>
    )
  }

  const FileIcon = extension === null ? Document : (extensionIcons[extension] ?? Document)

  return <FileIcon aria-hidden="true" className={className} height={size} width={size} />
}
