import './App.css'
import { AnimatePresence } from "framer-motion"
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { motion } from "motion/react"
import { useState, useEffect } from 'react'

import Footer from './components/Footer'
import Header from './components/Header'
import MainPhotos from './components/MainPhotos'
import Contact from './components/Contact'
import Rate from './components/Rate'
import Blog from './components/Blog'
import About from './components/About'


function App() {

  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timeout = setTimeout(() => setIsTransitioning(false), 500)
    return () => clearTimeout(timeout)
  }, [location.pathname]
  )

  return (
    <div>
      
      <Header />

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-white z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          />
        )}

      </AnimatePresence>

      <div className="max-w-screen-xl mx-auto px-4 mt-48 min-h-screen">

        <div className=""> 
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<MainPhotos />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/rate" element={<Rate />} />
                <Route path="/blog" element={<Blog />} />
            </Routes>
          </AnimatePresence>    
        </div>
      </div>
      <Footer />
    </div> 
  )
}

export default App
