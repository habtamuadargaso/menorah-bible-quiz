/* eslint-disable @next/next/no-img-element -- This audit page must preview the source assets directly. */
import type { CSSProperties } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding Preview",
  robots: { index: false, follow: false },
};

type BrandAsset = {
  name: string;
  file: string;
  dimensions: string;
  maxWidth?: number;
};

const brandAssets: BrandAsset[] = [
  { name: "Horizontal logo (SVG)", file: "logo-horizontal.svg", dimensions: "900 × 260", maxWidth: 540 },
  { name: "Horizontal logo (PNG)", file: "logo-horizontal.png", dimensions: "1800 × 520", maxWidth: 540 },
  { name: "Compact horizontal logo", file: "logo-horizontal-compact.svg", dimensions: "560 × 100", maxWidth: 500 },
  { name: "Vertical logo (SVG)", file: "logo-vertical.svg", dimensions: "480 × 560", maxWidth: 280 },
  { name: "Vertical logo (PNG)", file: "logo-vertical.png", dimensions: "823 × 960", maxWidth: 280 },
  { name: "Symbol (SVG)", file: "logo-symbol.svg", dimensions: "240 × 240", maxWidth: 220 },
  { name: "Symbol (PNG)", file: "logo-symbol.png", dimensions: "512 × 512", maxWidth: 220 },
  { name: "Light logo", file: "logo-light.svg", dimensions: "900 × 260", maxWidth: 540 },
  { name: "Dark logo", file: "logo-dark.svg", dimensions: "900 × 260", maxWidth: 540 },
  { name: "Monochrome logo", file: "logo-monochrome.svg", dimensions: "900 × 260", maxWidth: 540 },
  { name: "App icon", file: "app-icon-1024.png", dimensions: "1024 × 1024", maxWidth: 240 },
  { name: "Favicon 16", file: "favicon-16.png", dimensions: "16 × 16", maxWidth: 16 },
  { name: "Favicon 32", file: "favicon-32.png", dimensions: "32 × 32", maxWidth: 32 },
  { name: "Favicon ICO", file: "favicon.ico", dimensions: "16, 32, 48", maxWidth: 48 },
  { name: "Apple touch icon", file: "apple-touch-icon.png", dimensions: "180 × 180", maxWidth: 180 },
  { name: "Splash logo", file: "splash-logo.png", dimensions: "800 × 800", maxWidth: 240 },
  { name: "Open Graph image", file: "og-image.png", dimensions: "1200 × 630", maxWidth: 560 },
];

const symbolSizes = [16, 32, 64, 128, 256, 512, 1024];

function AssetStage({ asset, dark }: { asset: BrandAsset; dark: boolean }) {
  const imageStyle: CSSProperties = {
    width: `min(100%, ${asset.maxWidth ?? 540}px)`,
    maxHeight: asset.name === "Open Graph image" ? 330 : 360,
  };

  return (
    <div
      className={`flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border p-6 ${
        dark ? "border-white/10 bg-[#0A1E3D]" : "border-slate-200 bg-white"
      }`}
    >
      <img
        src={`/branding/${asset.file}`}
        alt={`${asset.name} on a ${dark ? "dark" : "light"} background`}
        className="block h-auto object-contain"
        style={imageStyle}
      />
    </div>
  );
}

export default function BrandingPreviewPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#eef1f5] px-4 py-12 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#9a741b]">Temporary audit page</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Menorah Bible Quiz branding</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Every file in <code className="rounded bg-slate-200 px-1.5 py-0.5">public/branding</code> shown on light
            and dark surfaces. Images are loaded directly from their source files for visual review.
          </p>
        </header>

        <section aria-labelledby="assets-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="assets-heading" className="text-2xl font-bold">Asset inventory</h2>
              <p className="mt-1 text-sm text-slate-600">{brandAssets.length} files · light and dark comparison</p>
            </div>
            <div className="hidden grid-cols-2 gap-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500 md:grid md:w-[calc(66.666%-0.5rem)]">
              <span>Light background</span>
              <span>Dark background</span>
            </div>
          </div>

          <div className="space-y-5">
            {brandAssets.map((asset) => (
              <article key={asset.file} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid md:grid-cols-[minmax(180px,1fr)_2fr_2fr] md:gap-4">
                <div className="mb-4 flex flex-col justify-center px-2 md:mb-0">
                  <h3 className="font-bold text-slate-900">{asset.name}</h3>
                  <code className="mt-2 break-all text-xs text-slate-500">{asset.file}</code>
                  <span className="mt-1 text-xs text-slate-400">{asset.dimensions}px</span>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 md:hidden">Light background</p>
                  <AssetStage asset={asset} dark={false} />
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 md:hidden">Dark background</p>
                  <AssetStage asset={asset} dark />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="scale-heading" className="mt-16">
          <h2 id="scale-heading" className="text-2xl font-bold">Symbol scale test</h2>
          <p className="mt-2 text-sm text-slate-600">SVG symbol rendered at each requested CSS size. Large samples scroll horizontally on narrow screens.</p>

          <div className="mt-6 space-y-6">
            {symbolSizes.map((size) => (
              <article key={size} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <h3 className="border-b border-slate-200 px-5 py-3 text-sm font-bold">{size} × {size}px</h3>
                <div className="grid md:grid-cols-2">
                  {[false, true].map((dark) => (
                    <div key={String(dark)} className={`overflow-auto p-6 ${dark ? "bg-[#0A1E3D]" : "bg-white"}`}>
                      <div style={{ width: size, height: size }}>
                        <img
                          src="/branding/logo-symbol.svg"
                          alt={`Symbol at ${size} pixels on a ${dark ? "dark" : "light"} background`}
                          width={size}
                          height={size}
                          className="block max-w-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
