import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><p className="section-kicker">404 / NOT FOUND</p><h1>That page is outside the platform.</h1><p>The address may be outdated, or the resource is not public.</p><Link className="button primary" href="/">Return home <span>→</span></Link></main>;
}
