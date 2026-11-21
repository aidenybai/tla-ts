// The file of the page a route shows, as Next.js lays out its app directory: app/page.tsx is /, and
// app/playground/page.tsx is /playground.
export const getPageFile = (route: string) => `./app${route === "/" ? "" : route}/page.tsx`;
