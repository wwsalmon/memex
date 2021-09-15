# Memex

## About

> Memex is the name of the hypothetical...device in which individuals would compress and store all of their books, records, and communications, "mechanized so that it may be consulted with exceeding speed and flexibility". The individual was supposed to use the memex as an automatic personal filing system, making the memex "an enlarged intimate supplement to his memory".

*From [Wikipedia: Memex](https://en.wikipedia.org/wiki/Memex?oldformat=true), referencing Vannevar Bush's 1945 article* ["As We May Think"](https://en.wikipedia.org/wiki/As_We_May_Think?oldformat=true)

This app is designed to be an all-purpose notetaking app, with an opinionated set of possible relationships between notes that make it more specialized than other notetaking apps, including ones with backlinking functionality like Roam Research, and more structured than general document tools like Notion.

This app can be used to make a blog, project log, journal, CRM, Zettelkasten system, and many other things.

This app is currently in development. More details to come.

## Development

To run in dev mode, create a `.env` file with the following variables:
- MONGODB_URL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXTAUTH_URL

Then run `npm run dev`.