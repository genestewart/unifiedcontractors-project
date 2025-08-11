/**
 * Sitemap generator utility for generating XML sitemaps
 * Supports static routes and dynamic content generation
 */

/**
 * Generate XML sitemap for the website
 * @param {string} baseUrl - Base URL of the website
 * @param {Array} routes - Array of route objects with path, lastmod, changefreq, priority
 * @returns {string} XML sitemap string
 */
export function generateSitemap(baseUrl = 'https://unifiedcontractors.com', routes = []) {
  // Default routes configuration
  const defaultRoutes = [
    {
      path: '/',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '1.0'
    },
    {
      path: '/services',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.9'
    },
    {
      path: '/about',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.8'
    },
    {
      path: '/portfolio',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      path: '/contact',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: '0.7'
    }
  ]

  // Merge default routes with provided routes
  const allRoutes = routes.length > 0 ? routes : defaultRoutes

  // Generate XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  allRoutes.forEach(route => {
    const url = `${baseUrl}${route.path === '/' ? '' : route.path}`
    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  })

  xml += `
</urlset>`

  return xml
}

/**
 * Generate robots.txt content
 * @param {string} baseUrl - Base URL of the website
 * @param {Array} disallowedPaths - Array of paths to disallow
 * @returns {string} robots.txt content
 */
export function generateRobotsTxt(baseUrl = 'https://unifiedcontractors.com', disallowedPaths = []) {
  const defaultDisallowed = [
    '/admin',
    '/api',
    '/private',
    '/*.json',
    '/test'
  ]

  const allDisallowed = [...defaultDisallowed, ...disallowedPaths]

  let robotsTxt = `User-agent: *
`

  // Add disallowed paths
  allDisallowed.forEach(path => {
    robotsTxt += `Disallow: ${path}\n`
  })

  robotsTxt += `
# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`

  return robotsTxt
}

/**
 * Create sitemap from Vue Router routes
 * @param {Array} routes - Vue Router routes array
 * @param {string} baseUrl - Base URL
 * @returns {string} XML sitemap
 */
export function createSitemapFromRoutes(routes, baseUrl = 'https://unifiedcontractors.com') {
  const sitemapRoutes = routes
    .filter(route => {
      // Exclude dynamic routes and admin routes
      return !route.path.includes(':') && 
             !route.path.includes('*') &&
             !route.path.startsWith('/admin')
    })
    .map(route => ({
      path: route.path,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: getChangeFrequency(route.path),
      priority: getPriority(route.path)
    }))

  return generateSitemap(baseUrl, sitemapRoutes)
}

/**
 * Get change frequency based on route path
 * @param {string} path - Route path
 * @returns {string} Change frequency
 */
function getChangeFrequency(path) {
  const frequencies = {
    '/': 'monthly',
    '/services': 'monthly',
    '/portfolio': 'monthly',
    '/about': 'yearly',
    '/contact': 'yearly'
  }
  return frequencies[path] || 'monthly'
}

/**
 * Get priority based on route path
 * @param {string} path - Route path
 * @returns {string} Priority value
 */
function getPriority(path) {
  const priorities = {
    '/': '1.0',
    '/services': '0.9',
    '/portfolio': '0.8',
    '/about': '0.8',
    '/contact': '0.7'
  }
  return priorities[path] || '0.5'
}

/**
 * Save sitemap to public directory (for build process)
 * This would typically be used in a build script
 * @param {string} content - Sitemap XML content
 * @param {string} filename - Output filename
 */
export function saveSitemap(content, filename = 'sitemap.xml') {
  // This is a placeholder for build-time sitemap generation
  // In a real build process, you'd write this to the public directory
  console.log(`Sitemap would be saved as ${filename}:`)
  console.log(content)
  return content
}

/**
 * Build complete sitemap with all sections
 * @param {Object} config - Configuration object
 * @returns {Object} Complete sitemap data
 */
export function buildCompleteSitemap(config = {}) {
  const {
    baseUrl = 'https://unifiedcontractors.com',
    routes = [],
    excludePaths = []
  } = config

  // Generate main sitemap
  const sitemap = generateSitemap(baseUrl, routes)
  
  // Generate robots.txt
  const robots = generateRobotsTxt(baseUrl, excludePaths)

  return {
    sitemap,
    robots,
    timestamp: new Date().toISOString(),
    urlCount: routes.length || 5
  }
}