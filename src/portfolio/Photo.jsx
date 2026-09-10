export default function Photo({ photo, className, eager = false, sizes = '(max-width: 767px) 90vw, 45vw' }) {
  return <picture className={className}>
    <source type="image/webp" srcSet={photo.srcSet} sizes={sizes} />
    <img data-photo-id={photo.id} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  </picture>
}
