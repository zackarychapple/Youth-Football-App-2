import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
// import { InjectManifest } from 'workbox-webpack-plugin';
import {withZephyr} from "zephyr-rspack-plugin";

const zephyrRsbuildPlugin = () => ({
  name: 'zephyr-rsbuild-plugin',
  setup(api: { modifyRspackConfig: (config: any) => Promise<void> }) {
    api.modifyRspackConfig(async (config: any) => {
      // this is important to avoid multiple zephyr build triggers
      config.name === 'web' && (await withZephyr()(config));
    });
  },
});


export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTypeCheck({
      enable: process.env.NODE_ENV === 'production',
    }),
    zephyrRsbuildPlugin()
  ],
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@hooks': './src/hooks',
      '@stores': './src/stores',
      '@lib': './src/lib',
      '@types': './src/types',
      '@styles': './src/styles',
    },
  },
  tools: {
    rspack: {
      plugins: [
        TanStackRouterRspack(),
        // new InjectManifest({
        //   swSrc: './src/sw.ts',
        //   swDest: 'sw.js',
        //   exclude: [/\.map$/, /^manifest.*\.js$/, /\.html$/],
        // }),
      ],
    },
    postcss: {
      postcssOptions: (context: any) => {
        return context.resourcePath.endsWith('.css')
          ? { plugins: [require('@tailwindcss/postcss')] }
          : {};
      },
    },
  },
  html: {
    template: './index.html',
    title: 'Football Tracker',
    favicon: './public/favicon.ico',
    meta: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      'theme-color': '#10B981',
    },
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
    define: {
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.PUBLIC_SUPABASE_URL || 'https://yepriyrcjmlmhrwpgqka.supabase.co'
      ),
      'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcHJpeXJjam1sbWhyd3BncWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODk5OTcsImV4cCI6MjA3MDk2NTk5N30.Fo2U0TWiROv-mru9PIrFSEfAk2rBpzp_vpTiahVVjvE'
      ),
    },
  },
  output: {
    distPath: {
      root: 'dist',
    },
    cleanDistPath: true,
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : false,
      css: false,
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: 'all',
        minSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|@tanstack)[\\/]/,
            priority: 40,
            name: 'framework',
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority)[\\/]/,
            priority: 30,
            name: 'ui',
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            name: 'vendor',
          },
        },
      },
    },
    bundleAnalyze: process.env.ANALYZE === 'true' ? {} : undefined,
  },
  server: {
    port: 3000,
    host: 'localhost',
  },
  dev: {
    hmr: true,
    progressBar: true,
  },
});
