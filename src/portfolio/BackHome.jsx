import { Link, useLocation } from 'react-router-dom'

export default function BackHome() {
  const { pathname } = useLocation()
  const projectDetail = pathname.startsWith('/projects/')
  return <Link to={projectDetail ? '/projects' : '/'} className="back-circle-control" aria-label={projectDetail ? 'Back to all projects' : 'Back to home'}><span className="back-chevron" aria-hidden="true" /></Link>
}
