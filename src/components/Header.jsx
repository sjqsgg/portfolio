import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Header() {
    return (
        <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center w-full fixed top-0 z-50 bg-white"
        >
                    <div className="logo-wrapper p-4">
                        <img src="/photos/IMG_5410.JPG" alt="logo" style={{ height: '90px' }} />
                    </div>

                    <ul className="nav grid grid-flow-col grid-rows-1 justify-content-center pt-3 pb-0 gap-8">
                        <li className="nav-item"> <Link to="/contact"> Contact </Link> </li>
                        <li className="nav-item"><Link to="/about"> About </Link></li>
                        <li className="nav-item"><Link to="/"> Selected Work </Link></li>
                        <li className="nav-item"><Link to="/rate"> Rates </Link></li>
                        <li className="nav-item"><Link to="/blog"> Blog </Link></li>
                    </ul>
            </motion.header>
    )
}

// logo + nav bar