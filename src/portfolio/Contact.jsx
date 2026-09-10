import RevealText from './RevealText'

export default function Contact() {
  return <section className="reference-contact" aria-label="Contact">
    <div className="reference-about-header" aria-hidden="true" />
    <div className="reference-contact-content">
      <div className="reference-contact-intro"><RevealText className="contact-kicker">CONTACT</RevealText><RevealText as="h1">Let’s talk.</RevealText></div>
      <div className="reference-contact-body"><div className="contact-links text-arrival">
        <a href="mailto:jiaqii7@outlook.com" aria-label="jiaqii7@outlook.com" data-cursor="Email">jiaqii7@outlook.com<span aria-hidden="true">↗</span></a>
        <a href="https://www.instagram.com/pepperr447/" target="_blank" rel="noreferrer" data-cursor="Instagram">@pepperr447<span aria-hidden="true">↗</span></a>
      </div></div>
    </div>
  </section>
}
