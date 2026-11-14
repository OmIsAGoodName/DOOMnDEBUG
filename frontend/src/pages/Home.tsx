import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';

export default function Home() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 text-vox-midnight dark:text-vox-cream">
      {/* 1. Panoramic Bedtime Story Hero Banner (Inspired by Image 1) */}
      <div className="relative rounded-3xl overflow-hidden border border-vox-warmBorder/80 dark:border-vox-border/80 shadow-storybook min-h-[340px] sm:min-h-[380px] lg:min-h-[400px] flex items-center">
        {/* Bedtime Story Scenic Vector Background (VoxFable palette: midnight, slate, gold, mint) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#111C2E] via-[#17243B] to-[#263B50]">
          {/* Ambient Warm Golden Glow */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-vox-gold/15 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -top-10 right-1/4 w-80 h-80 bg-vox-mint/10 blur-3xl pointer-events-none rounded-full" />

          {/* SVG Storybook Nightscape */}
          <svg
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-45 dark:opacity-65"
            viewBox="0 0 1200 480"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Crescent Moon */}
            <circle cx="980" cy="100" r="44" fill="#F4EBDD" opacity="0.92" />
            <circle cx="965" cy="88" r="40" fill="#17243B" />
            <circle cx="980" cy="100" r="54" fill="#E9AD61" opacity="0.2" />

            {/* Twinkling Stars */}
            <g fill="#F4EBDD" opacity="0.8">
              <circle cx="100" cy="70" r="2.5" />
              <circle cx="260" cy="50" r="3" />
              <circle cx="420" cy="95" r="2" />
              <circle cx="600" cy="65" r="2.5" />
              <circle cx="760" cy="115" r="3" />
              <circle cx="1100" cy="75" r="2.5" />
              <circle cx="180" cy="120" r="1.8" />
              <circle cx="870" cy="40" r="2" />
              <polygon points="510,40 513,50 523,53 513,56 510,66 507,56 497,53 507,50" fill="#E9AD61" opacity="0.9" />
              <polygon points="1040,150 1042,158 1050,160 1042,162 1040,170 1038,162 1030,160 1038,158" fill="#E9AD61" opacity="0.85" />
            </g>

            {/* Distant Misty Mountain Silhouette */}
            <path
              d="M0 320 L180 230 L380 300 L580 200 L820 290 L1040 220 L1200 280 L1200 480 L0 480 Z"
              fill="#1D2E45"
              opacity="0.75"
            />

            {/* Layered Rolling Emerald & Midnight Hills */}
            <path
              d="M0 360 Q240 270 480 325 T960 315 T1200 350 L1200 480 L0 480 Z"
              fill="#17243B"
              opacity="0.95"
            />
            <path
              d="M0 410 Q320 345 640 400 T1200 390 L1200 480 L0 480 Z"
              fill="#0F1726"
            />

            {/* Pine Tree Silhouettes */}
            <g fill="#0B101B" opacity="0.9">
              <polygon points="140,320 155,290 170,320" />
              <polygon points="143,305 155,280 167,305" />
              <polygon points="210,340 225,310 240,340" />
              <polygon points="450,350 470,310 490,350" />
              <polygon points="750,360 770,320 790,360" />
            </g>

            {/* Glowing Warm Fireflies */}
            <circle cx="330" cy="355" r="4" fill="#E9AD61" opacity="0.8" />
            <circle cx="330" cy="355" r="9" fill="#E9AD61" opacity="0.25" />
            <circle cx="500" cy="375" r="3.5" fill="#E9AD61" opacity="0.9" />
            <circle cx="680" cy="345" r="4.5" fill="#E9AD61" opacity="0.85" />
          </svg>
        </div>

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Hero Content (Left Headline & Pitch + Right Direct CTA) */}
        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-left">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white dark:text-vox-cream leading-tight">
              Where Bedtime Stories <br />
              <span className="text-vox-gold drop-shadow-sm">Come to Life</span>
            </h1>
            <p className="text-sm sm:text-base text-stone-200 dark:text-vox-muted font-medium leading-relaxed max-w-xl">
              Original, child-safe interactive cartoon engine. Turn any bedtime prompt into an animated story where kids can talk back to the characters.
            </p>
          </div>

          {/* Featured Start CTA Button (Matching Image 1's hero action) */}
          <Link
            to="/quick"
            className="flex items-center gap-4 bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/20 dark:border-vox-border/80 p-3.5 sm:p-4 rounded-2xl shadow-storybook transition-all group shrink-0"
          >
            <div className="space-y-0.5 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-vox-gold">
                Featured Mode
              </div>
              <div className="text-sm sm:text-base font-bold font-display text-white">
                Quick Story
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-vox-gold group-hover:bg-lantern-400 text-vox-midnight flex items-center justify-center text-xl shadow-gold-glow group-hover:scale-105 active:scale-95 transition-all">
              <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. 3-Column Media Card Showcase (Inspired by Image 1's clean video cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Quick Story */}
        <Link to="/quick" className="group">
          <Card
            hoverEffect
            className="p-0 overflow-hidden border-vox-warmBorder dark:border-vox-border bg-white dark:bg-vox-slate hover:border-vox-gold/80 dark:hover:border-vox-gold/60 shadow-storybook-sm group-hover:shadow-storybook transition-all flex flex-col h-full"
          >
            {/* 16:9 Thumbnail Preview with Duration Badge */}
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#111C2E] via-[#17243B] to-[#263B50]">
              <svg
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                viewBox="0 0 320 180"
                fill="none"
              >
                <rect width="320" height="180" fill="#111C2E" />
                <circle cx="270" cy="40" r="22" fill="#E9AD61" opacity="0.8" />
                <circle cx="265" cy="36" r="20" fill="#111C2E" />
                <circle cx="40" cy="30" r="1.5" fill="#F4EBDD" />
                <circle cx="120" cy="50" r="1.8" fill="#F4EBDD" />
                <circle cx="190" cy="25" r="1.5" fill="#F4EBDD" />
                <polygon points="50,140 65,95 80,140" fill="#17243B" />
                <polygon points="120,150 140,90 160,150" fill="#203348" />
                <polygon points="200,160 225,100 250,160" fill="#17243B" />
                <circle cx="150" cy="145" r="14" fill="#E9AD61" opacity="0.25" />
                <circle cx="150" cy="145" r="6" fill="#E9AD61" />
              </svg>

              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[11px] font-bold tracking-wider">
                Instant
              </span>
            </div>

            {/* Story Details */}
            <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌙</span>
                  <h2 className="text-xl font-bold font-display text-vox-midnight dark:text-vox-cream group-hover:text-vox-gold transition-colors">
                    Quick Story
                  </h2>
                </div>
                <p className="text-sm text-vox-lightMuted dark:text-vox-muted leading-relaxed">
                  Generate an animated episode from a single sentence prompt. Includes live interactive voice choices and instant playback.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-vox-gold pt-2 border-t border-vox-warmBorder/60 dark:border-vox-border/60">
                <span>Start Story</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 2: Studio Mode */}
        <Link to="/studio" className="group">
          <Card
            hoverEffect
            className="p-0 overflow-hidden border-vox-warmBorder dark:border-vox-border bg-white dark:bg-vox-slate hover:border-vox-gold/80 dark:hover:border-vox-gold/60 shadow-storybook-sm group-hover:shadow-storybook transition-all flex flex-col h-full"
          >
            {/* 16:9 Thumbnail Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#263B50] via-[#1F2D3D] to-[#141C27]">
              <svg
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                viewBox="0 0 320 180"
                fill="none"
              >
                <rect width="320" height="180" fill="#1F2D3D" />
                <circle cx="160" cy="75" r="42" fill="#E9AD61" opacity="0.3" />
                <circle cx="160" cy="75" r="38" fill="#17243B" />
                <circle cx="170" cy="65" r="10" fill="#E9AD61" opacity="0.9" />
                <line x1="160" y1="37" x2="160" y2="113" stroke="#263B50" strokeWidth="2" />
                <line x1="122" y1="75" x2="198" y2="75" stroke="#263B50" strokeWidth="2" />
                <rect x="250" y="40" width="55" height="110" fill="#2A3E54" />
                <line x1="80" y1="0" x2="80" y2="55" stroke="#E9AD61" strokeWidth="1.5" />
                <polygon points="73,55 87,55 83,75 77,75" fill="#E9AD61" />
                <circle cx="80" cy="65" r="18" fill="#E9AD61" opacity="0.25" />
              </svg>

              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[11px] font-bold tracking-wider">
                Series
              </span>
            </div>

            {/* Story Details */}
            <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎬</span>
                  <h2 className="text-xl font-bold font-display text-vox-midnight dark:text-vox-cream group-hover:text-vox-gold transition-colors">
                    Studio Mode
                  </h2>
                </div>
                <p className="text-sm text-vox-lightMuted dark:text-vox-muted leading-relaxed">
                  Create persistent series worlds, customize characters with accessories and color palettes, and generate complete seasons.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-vox-gold pt-2 border-t border-vox-warmBorder/60 dark:border-vox-border/60">
                <span>Open Studio</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 3: Episode Library */}
        <Link to="/library" className="group">
          <Card
            hoverEffect
            className="p-0 overflow-hidden border-vox-warmBorder dark:border-vox-border bg-white dark:bg-vox-slate hover:border-vox-mint/80 dark:hover:border-vox-mint/60 shadow-storybook-sm group-hover:shadow-storybook transition-all flex flex-col h-full"
          >
            {/* 16:9 Thumbnail Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#17243B] via-[#203348] to-[#1C363D]">
              <svg
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                viewBox="0 0 320 180"
                fill="none"
              >
                <rect width="320" height="180" fill="#1C363D" />
                <path d="M0 110 Q90 80 180 100 T320 95 L320 180 L0 180 Z" fill="#2E504A" />
                <path d="M0 135 Q140 105 280 130 L320 180 L0 180 Z" fill="#243F3A" />
                <rect x="145" y="85" width="30" height="50" rx="3" fill="#E9AD61" opacity="0.9" />
                <circle cx="150" cy="110" r="2.5" fill="#111C2E" />
                <circle cx="160" cy="110" r="30" fill="#E9AD61" opacity="0.25" />
                <circle cx="80" cy="80" r="2" fill="#78B8A4" />
                <circle cx="240" cy="70" r="2.5" fill="#78B8A4" />
              </svg>

              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-vox-mint font-mono text-[11px] font-bold tracking-wider">
                Library
              </span>
            </div>

            {/* Story Details */}
            <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  <h2 className="text-xl font-bold font-display text-vox-midnight dark:text-vox-cream group-hover:text-vox-mint transition-colors">
                    Episode Library
                  </h2>
                </div>
                <p className="text-sm text-vox-lightMuted dark:text-vox-muted leading-relaxed">
                  Browse your saved episodes, replay offline bundled adventures, inspect safety badges, and export to 720p MP4.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-vox-mint pt-2 border-t border-vox-warmBorder/60 dark:border-vox-border/60">
                <span>View Library</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
