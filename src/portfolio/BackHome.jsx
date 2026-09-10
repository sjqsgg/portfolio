import { Link } from 'react-router-dom'

export default function BackHome() {
  return <Link to="/" className="back-circle-control" aria-label="Back to home"><span className="back-chevron" aria-hidden="true" /></Link>
}
