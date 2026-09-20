const YT_ID_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/

export function extractYouTubeId(url: string): string | null {
  const match = url.match(YT_ID_RE)
  return match ? match[1] : null
}
