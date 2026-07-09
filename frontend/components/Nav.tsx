import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/briefs/today", label: "Today's Brief" },
  { href: "/briefs", label: "Brief by Date" },
  { href: "/articles", label: "Articles" },
  { href: "/sources", label: "Sources" },
  { href: "/workflow", label: "Workflow" },
];

export function Nav() {
  return (
    <header className="site-header">
      <nav className="nav">
        <Link className="brand" href="/">
          TMJ Editorial Intelligence
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
