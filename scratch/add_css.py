css_to_add = """

/* ==========================================================================
   Email Sandbox & Live Preview Typography
   ========================================================================== */
.email-rendered-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #18181b;
  font-size: 13.5px;
  line-height: 1.65;
}

.email-rendered-body p {
  margin-top: 0;
  margin-bottom: 14px;
}

.email-rendered-body p:last-child {
  margin-bottom: 0;
}

.email-rendered-body strong,
.email-rendered-body b {
  font-weight: 700;
  color: #09090b;
}

.email-rendered-body ul {
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 14px;
}

.email-rendered-body ol {
  list-style-type: decimal;
  margin-left: 20px;
  margin-bottom: 14px;
}

.email-rendered-body li {
  margin-bottom: 6px;
}

.email-rendered-body a {
  color: #18181b;
  font-weight: 600;
  text-decoration: underline;
}

.email-rendered-body a[style*="background"] {
  text-decoration: none !important;
}

.email-rendered-body h1,
.email-rendered-body h2,
.email-rendered-body h3,
.email-rendered-body h4 {
  font-weight: 700;
  color: #09090b;
  margin-top: 18px;
  margin-bottom: 8px;
}
"""

with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write(css_to_add)

print('Appended email preview typography to src/index.css successfully.')

