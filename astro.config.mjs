// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://quickhustletax.co.uk',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
    mdx(),
    // TODO: Re-add @vite-pwa/astro when it supports Astro 6
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
});
