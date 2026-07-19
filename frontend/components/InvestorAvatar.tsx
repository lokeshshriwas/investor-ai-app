/**
 * InvestorAvatar - circular avatar with Next.js Image and initials fallback.
 *
 * Image sources (Wikimedia Commons, public domain / CC-licensed):
 *  buffett - Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit.jpg
 *            Public Domain (US Government work, SelectUSA)
 *  graham  - Benjamin_Graham_(1894-1976)_portrait_on_23_March_1950.jpg
 *            Public Domain (pre-1978, no copyright notice)
 *  munger  - Charlie_Munger.jpg
 *            CC BY-SA 2.0 https://creativecommons.org/licenses/by-sa/2.0/
 *  dalio   - Ray_Dalio_2017.jpg
 *            CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/
 *  lynch   - Peter_Lynch_portrait.jpg
 *            Fair use / CC - verify license before commercial use
 *
 * New investors — photo status:
 *  fisher      - INITIALS FALLBACK (PF) — no confirmed free-license photo
 *  templeton   - INITIALS FALLBACK (JT) — historical, photo availability unconfirmed
 *  marks       - INITIALS FALLBACK (HM) — living, press photos only
 *  greenblatt  - INITIALS FALLBACK (JG) — no confirmed free-license photo
 *  klarman     - INITIALS FALLBACK (SK) — notoriously private, no public photos
 *  pabrai      - Wikimedia Commons attempted; falls back to (MP) if unavailable
 *  cundill     - INITIALS FALLBACK (PC) — deceased 2011, historical
 *  terrysmith  - INITIALS FALLBACK (TS) — press photos only
 *  jhunjhunwala - Wikimedia Commons attempted; falls back to (RJ) if unavailable
 *  damani      - INITIALS FALLBACK (RD2) — very private investor
 */

"use client";

import Image from "next/image";
import { useState } from "react";

const INITIALS: Record<string, string> = {
  buffett:      "WB",
  lynch:        "PL",
  graham:       "BG",
  munger:       "CM",
  dalio:        "RD",
  fisher:       "PF",
  templeton:    "JT",
  marks:        "HM",
  greenblatt:   "JG",
  klarman:      "SK",
  pabrai:       "MP",
  cundill:      "PC",
  terrysmith:   "TS",
  jhunjhunwala: "RJ",
  damani:       "RD",
};

interface InvestorAvatarProps {
  investorKey: string;
  size?: number;
}

export default function InvestorAvatar({ investorKey, size = 64 }: InvestorAvatarProps) {
  const [error, setError] = useState(false);
  const initials = INITIALS[investorKey] ?? investorKey.slice(0, 2).toUpperCase();

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--surface-hover)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  if (error) {
    return (
      <div style={containerStyle}>
        <span
          style={{
            fontSize: size * 0.32,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "-0.5px",
          }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Image
        src={`/investors/${investorKey}.jpg`}
        alt={`${initials} portrait`}
        width={size}
        height={size}
        style={{ objectFit: "cover", objectPosition: "top center", width: size, height: size }}
        onError={() => setError(true)}
        priority={size >= 64}
      />
    </div>
  );
}
