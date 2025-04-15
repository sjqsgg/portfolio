import { useEffect } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { motion } from 'framer-motion'

export default function MainPhotos() {
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery',
      children: 'a',
      pswpModule: () => import('photoswipe'),
    });
    lightbox.init();

    return () => {
      lightbox.destroy();
    };
  }, []);

  return (    
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.9 }}
      className="max-w-5xl mx-auto px-4 mt-32 space-y-16"
    >
    <div id="gallery" className="columns-2 md:columns-3 gap-4 px-4 [&>a]:mb-4">
      <a href="/photos/4071744705063_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4071744705063_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/A060541-R1-13-13A.jpg" data-pswp-width="1164" data-pswp-height="1164">
        <img src="/photos/A060541-R1-13-13A.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/A060541-R1-25-25A.JPG" data-pswp-width="1818" data-pswp-height="1228">
        <img src="/photos/A060541-R1-25-25A.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4041744705063_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4041744705063_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4061744705063_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4061744705063_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4051744705063_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4051744705063_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/A060541-R1-24-24A.JPG" data-pswp-width="1818" data-pswp-height="1228">
        <img src="/photos/A060541-R1-24-24A.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4001744704883_.pic.jpg" data-pswp-width="2361" data-pswp-height="2361">
        <img src="/photos/4001744704883_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/b479ae331017cd34f3a9815183419bd7.JPG" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/b479ae331017cd34f3a9815183419bd7.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/IMG_4622.JPG" data-pswp-width="1098" data-pswp-height="1510">
        <img src="/photos/IMG_4622.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4121744705200_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4121744705200_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/b1b6c60d3ff45dfec850b281454ea903.JPG" data-pswp-width="2304" data-pswp-height="3072">
        <img src="/photos/b1b6c60d3ff45dfec850b281454ea903.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4091744705200_.pic.jpg" data-pswp-width="2950" data-pswp-height="4185">
        <img src="/photos/4091744705200_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4111744705200_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4111744705200_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/4101744705200_.pic.jpg" data-pswp-width="2433" data-pswp-height="3637">
        <img src="/photos/4101744705200_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/3991744704883_.pic.jpg" data-pswp-width="3456" data-pswp-height="4608">
        <img src="/photos/3991744704883_.pic.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/P1011157.jpg" data-pswp-width="3456" data-pswp-height="4608">
        <img src="/photos/P1011157.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/IMG_4351.jpg" data-pswp-width="1102" data-pswp-height="1643">
        <img src="/photos/IMG_4351.jpg" alt="Example" className="w-full mb-4 shadow" />
      </a>

      <a href="/photos/IMG_4352.JPG" data-pswp-width="1228" data-pswp-height="1818">
        <img src="/photos/IMG_4352.JPG" alt="Example" className="w-full mb-4 shadow" />
      </a>

 
    </div>
    </motion.div>
  );
}

