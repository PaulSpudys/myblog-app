import React, { useState } from 'react';
 import './ContactPage.css';
 import emailjs from 'emailjs-com';
 
 function Contact() {
     const [formData, setFormData] = useState({
         name: '',
         email: '',
         subject: '',
         message: '',
     });
     
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [submitMessage, setSubmitMessage] = useState('');
     const [submitStatus, setSubmitStatus] = useState('');
 
     const handleChange = (e) => {
         setFormData({ ...formData, [e.target.name]: e.target.value });
     };
 
     const handleSubmit = (e) => {
         e.preventDefault();
         setIsSubmitting(true);
         setSubmitMessage('');
         setSubmitStatus('');
     
         // Pass the form data correctly
         const templateParams = {
             from_name: formData.name,  // Send form name as from_name
             from_email: formData.email, // Send form email as from_email
             subject: formData.subject,  // Send form subject
             message: formData.message,  // Send form message
             to_name: 'Recipient Name',  // Change this to the recipient's name or leave as static
         };
 
         emailjs.send(
             'service_zttlgy5', // Replace with your Service ID
             'template_txxubke', // Replace with your Template ID
             templateParams,  // Use templateParams here instead of e.target
             'kThCidWyibR3wfoYU' // Replace with your User ID
         )
         .then((result) => {
             setSubmitMessage('Message sent successfully! We\'ll get back to you soon.');
             setSubmitStatus('success');
             
             // Reset form fields after successful submission
             setFormData({
                 name: '',
                 email: '',
                 subject: '',
                 message: ''
             });
         })
         .catch((error) => {
             console.error('Error:', error);
             setSubmitMessage('Failed to send message. Please try again.');
             setSubmitStatus('error');
         })
         .finally(() => {
             setIsSubmitting(false);
         });
     };
 
     return (
         <div className="contact-container">
             <form className="contact-form" onSubmit={handleSubmit}>
                 <div className="form-group">
                     <label htmlFor="name">Name</label>
                     <input
                         type="text"
                         id="name"
                         name="name"
                         value={formData.name}
                         onChange={handleChange}
                         required
                     />
                 </div>
                 
                 <div className="form-group">
                     <label htmlFor="email">Email</label>
                     <input
                         type="email"
                         id="email"
                         name="email"
                         value={formData.email}
                         onChange={handleChange}
                         required
                     />
                 </div>
                 
                 <div className="form-group">
                     <label htmlFor="subject">Subject</label>
                     <input
                         type="text"
                         id="subject"
                         name="subject"
                         value={formData.subject}
                         onChange={handleChange}
                         required
                     />
                 </div>
                 
                 <div className="form-group">
                     <label htmlFor="message">Message</label>
                     <textarea
                         id="message"
                         name="message"
                         value={formData.message}
                         onChange={handleChange}
                         rows="5"
                         required
                     ></textarea>
                 </div>
                 
                 <button
                     type="submit"
                     className="submit-button"
                     disabled={isSubmitting}
                 >
                     {isSubmitting ? 'Sending...' : 'Send Message'}
                 </button>
                 
                 {submitMessage && (
                     <div className={`submit-message ${submitStatus}`}>
                         {submitMessage}
                     </div>
                 )}
             </form>
         </div>
     );
 }
 
 export default Contact;