import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "@/components/brand/social-icons";
import { footerNav, siteConfig } from "@/config/site";

const socials = [
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "YouTube", href: siteConfig.social.youtube, Icon: YoutubeIcon },
  { label: "X", href: siteConfig.social.x, Icon: XIcon },
];

export function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-20 overflow-hidden bg-navy-950 bg-lanes text-navy-200">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr] lg:py-20">
        <div className="max-w-sm">
          <Logo onDark />
          <p className="mt-6 leading-relaxed text-navy-300">{siteConfig.description}</p>
          <ul className="mt-8 space-y-3 text-sm">
            <li>
              <a href={`tel:${siteConfig.contact.phone}`} className="flex items-center gap-3 hover:text-white">
                <Phone className="size-4 text-lime" /> {siteConfig.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3 hover:text-white">
                <Mail className="size-4 text-lime" /> {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-lime" /> Serving Delhi NCR
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{group.title}</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="transition-colors hover:text-lime">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 pb-24 text-xs text-navy-400 sm:flex-row md:pb-6">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-white/10 text-navy-200 transition-colors hover:border-lime hover:text-lime"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
