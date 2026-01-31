# Welcome Email Message

Sent from **no_reply@enterpriserm.com** after the user verifies their email. Update this doc when you change the copy; the server uses the content below (see `sendWelcomeEmail` in `server.js`).

---

## Subject

`Welcome to Enterprise Room Business Hub`

---

## Plain text version

```
Hello [Name],

Welcome to Enterprise Room Business Hub. Your email is verified and your account is ready to use.

What you can do next:

• Explore events and RSVP to upcoming sessions
• Read our blog and stay updated
• Use our tools and resources
• Browse and join our directories (businesses and members)
• Enter pitch competitions and grow your business
• Manage your profile and keep your details up to date

If you have any questions, visit our Contact page or reach out through the platform.

We're glad to have you.

— The Enterprise Room Business Hub Team
```

---

## HTML version

- **Heading:** Welcome to Enterprise Room Business Hub  
- **Opening:** Hello [Name], Welcome to Enterprise Room Business Hub. Your email is verified and your account is ready to use.  
- **Section:** What you can do next (bulleted list as above).  
- **Closing:** If you have any questions, visit our Contact page or reach out through the platform. We're glad to have you.  
- **Signature:** — The Enterprise Room Business Hub Team

---

*Last updated: reference for edits. Server implementation in `server.js` → `sendWelcomeEmail()`.*
