# URL Shortener Web App

Frontend dashboard for url.k61.dev built with React and Vite.

## Features

- Dashboard with sortable, filterable URL list
- Create new shortened URLs
- Copy short URLs to clipboard
- Delete URLs
- User management (invite others)
- Responsive design

## Development

```bash
npm install
npm run dev  # Start development server at http://localhost:5173
```

### Local Development Without Backend

To test the UI without running the Azure Functions backend:

1. Ensure `.env` has `VITE_API_URL` empty (or remove the line)
2. Start dev server: `npm run dev`
3. App will use mock data and bypass authentication

This is useful for UI-only changes like styling, layout, or component behavior.

## Build

```bash
npm run build  # Creates production build in dist/
```

## Status

- [x] Microsoft OAuth authentication
- [x] URL editing functionality
- [x] Mobile responsive CSS
- [x] Dashboard with sorting and pagination
- [x] Copy to clipboard
- [x] Font Awesome icons
- [x] QR code generation with modal and download

## Future Enhancements

- [ ] [Dashboard filtering](https://github.com/kurtzeborn/url-shortener/issues/6)
- [ ] Loading skeletons
- [ ] Export URLs feature
