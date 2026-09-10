import RevealText from './RevealText'
import { cvUrl, cvFilename } from './CVLightbox'

export default function About() {
  return <section className="reference-about" aria-label="About">
    <div className="reference-about-header" aria-hidden="true" />
    <div className="reference-about-content">
      <div className="reference-about-intro"><p className="text-arrival">ABOUT</p><RevealText as="h1" lines={["Software engineer", "& photographer."]} /></div>
      <div className="reference-about-body text-arrival">
        <p>Based in the Netherlands. I build useful software and photograph people, places and moments.</p>
        <dl className="reference-about-meta">
          <div><dt>NAME</dt><dd>Jiaqi Shi</dd></div>
          <div><dt>ROLE</dt><dd>Software engineer<br />Photographer</dd></div>
          <div id="contact"><dt>CONTACT</dt><dd className="reference-contact-links"><a href="mailto:jiaqii7@outlook.com">jiaqii7@outlook.com <span aria-hidden="true">↗</span></a><a href="https://www.instagram.com/pepperr447/" target="_blank" rel="noreferrer">@pepperr447 <span aria-hidden="true">↗</span></a><a href={cvUrl} download={cvFilename}>Download my CV <span aria-hidden="true">↘</span></a></dd></div>
        </dl>
      </div>
    </div>
  </section>
}
