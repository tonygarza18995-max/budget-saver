#!/usr/bin/env python3
"""Add Open Graph, Twitter Card meta tags, Google verification to all HTML files in dist-web."""

import os
import glob

DIST_WEB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist-web")

# OG image URL (hosted on CDN)
OG_IMAGE_URL = "https://manus-storage.s3.us-east-1.amazonaws.com/c9c3c3c3-budget-saver-og-preview.png"

# Meta tags to inject
META_TAGS = """
    <!-- Open Graph / Social Sharing -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://budgetsavr-arqfzywu.manus.space/api/web/" />
    <meta property="og:title" content="Budget Saver — Free Budgeting App" />
    <meta property="og:description" content="Take control of your money with Budget Saver. Track spending, set budgets, reach savings goals — all without ads or forced bank linking." />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Budget Saver — Free Budgeting App" />
    <meta name="twitter:description" content="Take control of your money with Budget Saver. Track spending, set budgets, reach savings goals — all without ads or forced bank linking." />
    <meta name="twitter:image" content="{og_image}" />
    <!-- Google Search Console Verification -->
    <meta name="google-site-verification" content="google16f3ab1f2f6843fc" />
""".format(og_image=OG_IMAGE_URL)

# Find all HTML files
html_files = glob.glob(os.path.join(DIST_WEB, "**", "*.html"), recursive=True)
html_files += glob.glob(os.path.join(DIST_WEB, "*.html"))
html_files = list(set(html_files))

count = 0
for html_file in html_files:
    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Skip if already has OG tags
    if "og:title" in content:
        continue
    
    # Insert meta tags before </head>
    if "</head>" in content:
        content = content.replace("</head>", META_TAGS + "  </head>")
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(content)
        count += 1

print(f"Added meta tags to {count} HTML files")

# Create Google verification file
verification_file = os.path.join(DIST_WEB, "google16f3ab1f2f6843fc.html")
with open(verification_file, "w", encoding="utf-8") as f:
    f.write("google-site-verification: google16f3ab1f2f6843fc.html")
print("Created Google verification file")

# Create sitemap.xml
sitemap_content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/profile</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/budget</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/savings</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/transactions</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://budgetsavr-arqfzywu.manus.space/api/web/insights</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
"""
sitemap_file = os.path.join(DIST_WEB, "sitemap.xml")
with open(sitemap_file, "w", encoding="utf-8") as f:
    f.write(sitemap_content)
print("Created sitemap.xml")
