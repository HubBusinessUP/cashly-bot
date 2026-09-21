import { useState } from 'react'
import { extractYouTubeId } from '../lib/youtube'

interface YouTubeEmbedProps {
  videoUrl: string
  title: string
}

/** Click-to-play YouTube embed: shows a thumbnail until clicked, then swaps in the iframe player. */
export function YouTubeEmbed({ videoUrl, title }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYouTubeId(videoUrl)

  if (!videoId) {
    const isSearchLink = videoUrl.includes('/results?')
    return (
      <a href={videoUrl} target="_blank" rel="noreferrer noopener" className="text-sm font-medium text-brand-600 hover:underline">
        {isSearchLink ? 'Cerca il tutorial su YouTube' : 'Guarda il video tutorial su YouTube'}
      </a>
    )
  }

  return (
    <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
      {playing ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Riproduci video: ${title}`}
          className="group relative h-full w-full"
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
