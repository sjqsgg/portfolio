// Explicit heading lines retain the reference's typography and wrap naturally on small screens.
export default function RevealText({ as: tag = 'p', lines, children, className = '', ...props }) {
  const Tag = tag
  return <Tag {...props} className={`reveal-text ${className}`}>
    {lines ? lines.map((line, i) => <span className="reveal-line" style={{ '--line': i }} key={line}>{line}</span>) : <span className="reveal-line">{children}</span>}
  </Tag>
}
