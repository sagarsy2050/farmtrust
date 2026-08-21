import * as React from "react"

import { cn } from "@/lib/utils"

// Minimal wrapper around <img>. fittingType="fill" makes the image cover its
// container (absolute-positioned, object-fit: cover) — used for square/aspect
// crops throughout the marketplace (product cards, cart thumbnails, product
// detail hero). Any other fittingType (or none) renders a plain in-flow
// object-cover <img>.
const Image = React.forwardRef(({ src, alt = "", fittingType, className, ...props }, ref) => {
  if (fittingType === "fill") {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <img
          ref={ref}
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          {...props}
        />
      </div>
    )
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      {...props}
    />
  )
})
Image.displayName = "Image"

export { Image }
