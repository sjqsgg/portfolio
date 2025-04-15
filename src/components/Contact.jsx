import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser';
import { useState } from 'react';

export default function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [stateMessage, setStateMessage] = useState(null)

    function sendEmail(event) {
        event.persist()
        event.preventDefault()

        emailjs
            .sendForm("service_wfvrem4", "template_3co7tzp", event.target, "-OH5OXnhuk83KlVG8").then(
                (result) => {
                    setStateMessage('Message sent!');
                    setIsSubmitting(false);
                    setTimeout(() => {
                      setStateMessage(null);
                    }, 5000); // hide message after 5 seconds
                  },
                (error) => {
                    setStateMessage('Something went wrong, please try again later');
                    setIsSubmitting(false);
                    setTimeout(() => {
                      setStateMessage(null);
                    }, 5000); // hide message after 5 seconds
                  }
            )

            event.target.reset()
    }



    return(
        <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-xl mx-auto px-4">
                <h1 className="text-center text-2xl font-semibold mt-24">THIS IS THE BEGINNING OF SOMETHING JOYFUL</h1>
                <p className="text-gray-600">Let's chat!</p>
                <h2 className="text-lg font-bold mt-4 uppercase tracking-wide">Areas of Work</h2>
                <p className="text-lg">the Netherlands, mainly Amsterdam</p>
                <p className="text-base text-gray-600 leading-relaxed">
                    (Inquires are generally answered within 1 day during normal workday).
                </p>
            </div>

            <div className="send-form ">
            <form onSubmit={sendEmail} className="space-y-6">
                <div>
                    <label>First Name *</label>
                    <input type="text" name="first_name" required className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Last Name *</label>
                    <input type="text" name="last_name" required className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Email Address *</label>
                    <input type="email" name="user_email" required className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Phone Number</label>
                    <input type="tel" name="phone_number" className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Shoot Type</label>
                    <select name="shoot_type" className="w-full border p-2 rounded">
                    <option value="">Select an Option...</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Branding">Commercial / Branding</option>
                    <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label>Desired Shoot Date</label>
                    <input type="date" name="shoot_date" className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>How did you hear about me?</label>
                    <input type="text" name="referral" className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label>Message</label>
                    <textarea name="message" rows="4" className="w-full border p-2 rounded" />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
                >
                    {isSubmitting ? "Sending..." : "Send"}
                </button>

                {stateMessage && <p className="text-center text-green-600 mt-4">{stateMessage}</p>}
                </form>
            </div>
        </div>
    )
}