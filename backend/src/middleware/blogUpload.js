const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Keep consistent with /home/u1zh8984/public_html/1slabs.my.id/uploads symlink -> backend/uploads
const uploadsRootDir = path.join(__dirname, '..', '..', 'uploads');
const blogUploadDir = path.join(uploadsRootDir, 'blog');
const articleImagesRootDir = path.join(uploadsRootDir, 'articles');
if (!fs.existsSync(blogUploadDir)) {
  fs.mkdirSync(blogUploadDir, { recursive: true });
}
if (!fs.existsSync(articleImagesRootDir)) {
  fs.mkdirSync(articleImagesRootDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, blogUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const base = path
      .basename(file.originalname || 'image', ext)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'blog-media';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau SVG.'), false);
  }
};

const blogUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

function scanMediaDirectory(baseDir, urlPrefix, folderLabel, maxDepth = 4) {
  if (!fs.existsSync(baseDir)) return [];
  const items = [];

  function walk(dir, relPrefix, depth) {
    if (depth > maxDepth) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const nextRel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, nextRel, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) continue;
        const stat = fs.statSync(fullPath);
        items.push({
          filename: entry.name,
          relative_path: nextRel,
          folder: folderLabel,
          url: `${urlPrefix}/${nextRel}`,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString()
        });
      }
    }
  }

  walk(baseDir, '', 0);
  return items;
}

/**
 * List uploaded blog & automated article media images sorted newest-first.
 */
function listBlogMedia(scope = 'all') {
  const normalizedScope = String(scope || 'all').toLowerCase();
  const items = [];
  if (normalizedScope === 'all' || normalizedScope === 'blog') {
    items.push(...scanMediaDirectory(blogUploadDir, '/uploads/blog', 'blog', 1));
  }
  if (normalizedScope === 'all' || normalizedScope === 'articles') {
    items.push(...scanMediaDirectory(articleImagesRootDir, '/uploads/articles', 'articles', 4));
  }
  items.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
  return items;
}

/**
 * Safely delete an uploaded blog media file by basename (prevents path traversal).
 */
function deleteBlogMedia(filename) {
  const safeName = path.basename(String(filename || ''));
  if (!safeName || safeName !== filename) {
    throw new Error('Nama file media tidak valid.');
  }
  const target = path.join(blogUploadDir, safeName);
  if (!target.startsWith(blogUploadDir)) {
    throw new Error('Path traversal tidak diizinkan.');
  }
  if (!fs.existsSync(target)) {
    return false;
  }
  fs.unlinkSync(target);
  return true;
}

module.exports = {
  blogUpload,
  blogUploadDir,
  articleImagesRootDir,
  listBlogMedia,
  deleteBlogMedia
};

