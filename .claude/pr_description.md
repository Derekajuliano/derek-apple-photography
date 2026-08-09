# Fix JSON.stringify typos in contact form flow

Contact form submission and the Cloudflare Pages contact function were failing due to three case-sensitive typos: `json.stringify()` instead of the correct global `JSON.stringify()`.

## Changes:
- **Frontend contact submission** (`js/main.js:174`) – Fixed form data serialization
- **Backend validation error** (`functions/api/contact.js:80`) – Fixed error response serialization  
- **Backend Resend API call** (`functions/api/contact.js:114`) – Fixed email payload serialization

## Before:
```javascript
body: json.stringify(data)  // ❌ ReferenceError: json is not defined
```

## After:
```javascript
body: JSON.stringify(data)  // ✅ Correct global object
```

All three instances now correctly use the global `JSON` object, fixing runtime failures when users submit the contact form or validation errors occur.
