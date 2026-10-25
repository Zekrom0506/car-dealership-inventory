import { useState } from 'react'
import { Car } from 'lucide-react'

/**
 * The card's photo area, one fixed 16:9 ratio for every card (object-cover crops to fit).
 * No imageUrl, or an image that fails to load → the car-icon placeholder.
 */
export function VehiclePhoto({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = src && !failed

  return (
    <div className="aspect-video w-full overflow-hidden bg-photo">
      {showPhoto ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div role="img" aria-label="No photo" className="flex h-full w-full items-center justify-center text-grease">
          <Car size={72} strokeWidth={1} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
