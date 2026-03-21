#!/usr/bin/env node

/**
 * Build script for PHA Process Optimizer
 * Copies all static files to dist directory for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

// Files to copy to dist
const FILES_TO_COPY = [
  'index.html',
  'custom.js',
  'compounding-guide.js',
  'straw-guide.js',
  'pha-integration.js',
  'sw.js',
  'manifest.webmanifest',
  'README.txt',
  'README.md'
];

// Directories to copy to dist
const DIRS_TO_COPY = [
  'data',
  'icons'
];

const DIST_DIR = 'dist';

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
  console.log('🏗️  Building PHA Process Optimizer...\n');

  // Clean dist directory if it exists
  if (fs.existsSync(DIST_DIR)) {
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
