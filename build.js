#!/usr/bin/env node

/**
 * Build script for PHA Process Optimizer
 * Copies runtime assets to dist for Cloudflare Pages and Netlify deployment.
 */

const fs = require('fs');
const path = require('path');

// Files to copy to dist
const FILES_TO_COPY = [
  'index.html',
  '_headers',
  'tokens.css',
  'overrides.css',
  'custom.js',
  'troubleshooting-data.js',
  'troubleshooting-visuals-data.js',
  'troubleshooting-visuals-sw.js',
  'vent-guide-data.js',
  'vent-guide.js',
  'vent-guide.css',
  'flash-guide-data.js',
  'flash-guide.js',
  'flash-guide.css',
  'flash-mold-viewer.js',
  'troubleshooting-visuals.js',
  'troubleshooting-viewer.js',
  'troubleshooting-visuals.css',
  'glossary.js',
  'anomaly-codes.js',
  'tars-batch-schema.js',
  'compounding-guide.js',
  'straw-guide.js',
  'pha-integration.js',
  'process-evidence.js',
  'process-atlas.js',
  'process-atlas.css',
  'injection-motion.js',
  'equipment-models.js',
  'equipment-motion.js',
  'equipment-kinematics.js',
  'equipment-study.js',
  'sw.js',
  'manifest.webmanifest',
  'README.txt',
  'README.md'
];

// Directories to copy to dist
const DIRS_TO_COPY = [
  'data',
  'icons',
  'assets',
  'vendor'
];

const DIST_DIR = path.resolve(__dirname, 'dist');

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDir(srcPath, destPath);
    } else {
      if (/\.blend\d?$/.test(entry.name)) continue; // Editable source stays in the repo, not the web payload.
      // Copy file
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${srcPath} → ${destPath}`);
    }
  }
}

/**
 * Main build function
 */
function build() {
  require('./scripts/sync-troubleshooting.cjs');
  require('./scripts/sync-troubleshooting-visuals.cjs');
  require('./scripts/sync-vent-guide.cjs');
  console.log('🏗️  Building PHA Process Optimizer...\n');

  // Clean dist directory if it exists
  if (fs.existsSync(DIST_DIR)) {
    if (path.dirname(DIST_DIR) !== path.resolve(__dirname)) throw new Error('Unexpected build destination');
    console.log('🧹 Cleaning existing dist directory...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // Create dist directory
  console.log('📁 Creating dist directory...');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy files
  console.log('\n📄 Copying files...');
  for (const file of FILES_TO_COPY) {
    const src = file;
    const dest = path.join(DIST_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${src} → ${dest}`);
    } else {
      console.warn(`  ⚠️  ${src} not found, skipping`);
    }
  }

  // Copy directories
  console.log('\n📂 Copying directories...');
  for (const dir of DIRS_TO_COPY) {
    if (fs.existsSync(dir)) {
      console.log(`  Copying ${dir}/...`);
      copyDir(dir, path.join(DIST_DIR, dir));
    } else {
      console.warn(`  ⚠️  ${dir}/ not found, skipping`);
    }
  }

  // Pages limits each asset to 25 MiB. Fail locally before an invalid deployment.
  // The portable HTML and editable art are intentionally outside this output.
  function validateAssets(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const asset = path.join(directory, entry.name);
      if (entry.isDirectory()) validateAssets(asset);
      else if (fs.statSync(asset).size > 25 * 1024 * 1024) {
        throw new Error(`Cloudflare Pages asset exceeds 25 MiB: ${path.relative(DIST_DIR, asset)}`);
      }
    }
  }
  validateAssets(DIST_DIR);

  console.log('\n✅ Build completed successfully!');
  console.log(`📦 Output directory: ${DIST_DIR}/\n`);
}

// Run build
try {
  build();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
