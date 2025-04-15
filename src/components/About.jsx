import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function About() {
  const ref1= useRef();
  const isVisible1 = useInView(ref1, {margin: "0px"})

  const ref2= useRef();
  const isVisible2 = useInView(ref2, {margin: "0px"})

  const ref3= useRef();
  const isVisible3 = useInView(ref3, {margin: "0px"})

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto px-4 mt-32 space-y-16"
    >

<motion.div 
  ref={ref1}
  initial={{ opacity: 0.3, y: 50, filter: "blur(28px)" }}
  animate={isVisible1
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0.3, y: 0, filter: "blur(28px)" }
  }
  transition={{ duration: 0.6 }}
  className="min-h-screen pt-8 text-center"
>
        <h1 className="text-6xl md:text-8xl  font-light tracking-wide">JIAQI SHI</h1>
        <h2 className="text-6xl md:text-8xl  mt-2 font-thin">PHOTOGRAPHER & PROGRAMMER</h2>
      </motion.div>


      <motion.div 
        ref={ref2}
        initial={{ opacity: 0, y: 50, filter: "blur(28px)" }}
        animate={isVisible2 
          ? { opacity: 1, y: 0, filter: "blur(0px)" } 
          : { opacity: 0.3, y:0, filter:"blur(28px)"}
        }
        transition={{ duration: 0.8 }}
        className="text-lg leading-relaxed min-h-screen space-y-4"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8" >
          <div>
            <h1 className='text-6xl pb-2'>emotive storytelling photographer</h1>
            <p>
              I care deeply about balance, composition and the logic behind an image.
              What I love most is capturing the beauty in fleeting moments — those genuine, relaxed, and radiant expressions that feel truly alive.
            </p>
            <p>
              I want people to get photos where they feel like themselves, not just like a trend.
              But of course — if you want trendy, I can do that too.
            </p>
            <p>
              The shooting experience matters as much as the photos. I believe it should be joyful and light, never stressful.
              My aesthetic leans towards calm tones, gentle lighting, and a nostalgic, soft look.
            </p>
          </div>
          <img className="w-100" src="/photos/IMG_5427.jpg" alt='jiaqi'/>
        </div>  
      </motion.div>

    <motion.div 
        ref={ref3}
        initial={{ opacity: 0, y: 50, filter: "blur(28px)" }}
        animate={isVisible3 
          ? { opacity: 1, y: 0, filter: "blur(0px)" } 
          : { opacity: 0.3, y:0, filter:"blur(28px)"}
        }
        transition={{ duration: 0.8 }}
        className="min-h-screen border-gray-700 pt-6 text-lg leading-relaxed space-y-2"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8" >
          <div>
            <h1 className="text-6xl pb-2">Your Story, timelessly framed</h1>
            <p>
            I love capturing people in their most natural and relaxed moments — the kind of moments that feel like you.
            I focus on gentle movements, subtle colors, and the light that falls quietly.
            I might offer a bit of direction here and there, but the story is always yours.

            My goal is for you to walk away with photos that feel warm, honest, and truly you.
            </p>
          </div>
          <img className="w-130 h-auto" src="/photos/IMG_5429.JPG" alt='your-story'/>
        </div>
        
        <div className="text-center mt-32">
          <a href="/contact">
            <button className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition">
              Write your Story
            </button>
          </a>
      </div>

      </motion.div>

      <div className="border-gray-700 border-t pt-6 text-lg leading-relaxed space-y-2">
        <h3 className="text-xl font-bold uppercase tracking-wider">This Website</h3>
    
        <p>I'm a Bachelor's student in Computer Science at VU Amsterdam, actively seeking internship opportunities. </p>
        <p>I built this Website using React and Tailwind CSS, with animations powered by Framer Motion.</p>
        I'm available for onsite internships five days a week, and currently based in Amsterdam — though I'm happy to commute further if needed. If you're hiring, let's connect!
        
        <p>
          📮 <a href="mailto:jiaqii7@outlook.com" className="underline">jiaqii7@outlook.com</a>
        </p>
      </div>
    </motion.div>
  );
}