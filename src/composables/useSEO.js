import { ref, onUnmounted } from 'vue'

/**
 * SEO composable for managing meta tags, Open Graph data, and structured data
 * Provides utilities for dynamic meta tag management across Vue components
 */
export function useSEO() {
  const metaTags = ref(new Map())

  // Base site information
  const siteInfo = {
    siteName: 'Unified Contractors',
    baseUrl: 'https://unifiedcontractors.com',
    defaultImage: '/images/unified-contractors-og.jpg',
    businessInfo: {
      name: 'Unified Contractors',
      address: '8343 N Silver Creek Rd, Park City, UT 84098',
      phone: '(435) 555-0100',
      email: 'info@unifiedcontractors.com',
      priceRange: '$$$$',
      areaServed: 'Park City, Utah',
      foundingDate: '1998'
    }
  }

  /**
   * Set page-specific meta tags
   * @param {Object} meta - Meta tag configuration
   */
  const setMeta = (meta) => {
    const {
      title,
      description,
      keywords,
      image,
      url,
      type = 'website',
      noindex = false,
      nofollow = false,
      canonical
    } = meta

    // Build full title with site name
    const fullTitle = title ? `${title} | ${siteInfo.siteName}` : siteInfo.siteName

    // Set basic meta tags
    setMetaTag('title', fullTitle)
    setMetaTag('description', description)
    if (keywords) setMetaTag('keywords', keywords)

    // Set robots meta
    const robotsContent = []
    if (noindex) robotsContent.push('noindex')
    else robotsContent.push('index')
    if (nofollow) robotsContent.push('nofollow')
    else robotsContent.push('follow')
    setMetaTag('robots', robotsContent.join(', '))

    // Set canonical URL
    if (canonical) {
      setLinkTag('canonical', canonical)
    } else if (url) {
      setLinkTag('canonical', `${siteInfo.baseUrl}${url}`)
    }

    // Set Open Graph tags
    setOpenGraphTags({
      title: fullTitle,
      description,
      image: image || siteInfo.defaultImage,
      url: url ? `${siteInfo.baseUrl}${url}` : siteInfo.baseUrl,
      type
    })

    // Set Twitter Card tags
    setTwitterCardTags({
      title: fullTitle,
      description,
      image: image || siteInfo.defaultImage
    })
  }

  /**
   * Set Open Graph meta tags
   * @param {Object} og - Open Graph configuration
   */
  const setOpenGraphTags = ({ title, description, image, url, type }) => {
    setMetaTag('og:title', title, 'property')
    setMetaTag('og:description', description, 'property')
    setMetaTag('og:image', image.startsWith('http') ? image : `${siteInfo.baseUrl}${image}`, 'property')
    setMetaTag('og:url', url, 'property')
    setMetaTag('og:type', type, 'property')
    setMetaTag('og:site_name', siteInfo.siteName, 'property')
    setMetaTag('og:locale', 'en_US', 'property')
  }

  /**
   * Set Twitter Card meta tags
   * @param {Object} twitter - Twitter Card configuration
   */
  const setTwitterCardTags = ({ title, description, image }) => {
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', image.startsWith('http') ? image : `${siteInfo.baseUrl}${image}`)
  }

  /**
   * Set a meta tag in the document head
   * @param {string} name - Meta tag name or property
   * @param {string} content - Meta tag content
   * @param {string} attribute - Attribute name (name or property)
   */
  const setMetaTag = (name, content, attribute = 'name') => {
    if (!content) return

    // Update document title directly
    if (name === 'title') {
      document.title = content
      return
    }

    // Find existing tag or create new one
    let tag = document.querySelector(`meta[${attribute}="${name}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attribute, name)
      document.head.appendChild(tag)
      metaTags.value.set(name, tag)
    }
    
    tag.setAttribute('content', content)
  }

  /**
   * Set a link tag in the document head
   * @param {string} rel - Link relation
   * @param {string} href - Link href
   */
  const setLinkTag = (rel, href) => {
    if (!href) return

    let tag = document.querySelector(`link[rel="${rel}"]`)
    if (!tag) {
      tag = document.createElement('link')
      tag.setAttribute('rel', rel)
      document.head.appendChild(tag)
      metaTags.value.set(`link-${rel}`, tag)
    }
    
    tag.setAttribute('href', href)
  }

  /**
   * Generate structured data (JSON-LD) for local business
   * @param {Object} overrides - Override default business data
   */
  const setStructuredData = (overrides = {}) => {
    const businessData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${siteInfo.baseUrl}#business`,
      name: siteInfo.businessInfo.name,
      description: 'Premier construction and remodeling services in Park City, Utah. Custom homes, design services, water damage restoration, and more.',
      url: siteInfo.baseUrl,
      telephone: siteInfo.businessInfo.phone,
      email: siteInfo.businessInfo.email,
      priceRange: siteInfo.businessInfo.priceRange,
      foundingDate: siteInfo.businessInfo.foundingDate,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '8343 N Silver Creek Rd',
        addressLocality: 'Park City',
        addressRegion: 'UT',
        postalCode: '84098',
        addressCountry: 'US'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.6461,
        longitude: -111.5081
      },
      areaServed: {
        '@type': 'City',
        name: 'Park City',
        '@id': 'https://en.wikipedia.org/wiki/Park_City,_Utah'
      },
      serviceArea: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 40.6461,
          longitude: -111.5081
        },
        geoRadius: '50000' // 50km radius
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Construction Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Custom Home Construction',
              description: 'Full-service custom home building from design to completion'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Design Services',
              description: 'Architectural design and planning services'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Home Remodeling',
              description: 'Complete home renovation and remodeling services'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Water Damage Restoration',
              description: '24/7 emergency water damage restoration and mitigation'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Sump Pump Systems',
              description: 'Installation and maintenance of sump pump systems'
            }
          }
        ]
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '18:00'
        }
      ],
      sameAs: [
        // Add social media URLs when available
      ],
      ...overrides
    }

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(businessData)
    document.head.appendChild(script)
    metaTags.value.set('structured-data', script)
  }

  /**
   * Generate breadcrumb structured data
   * @param {Array} breadcrumbs - Array of breadcrumb items {name, url}
   */
  const setBreadcrumbStructuredData = (breadcrumbs) => {
    if (!breadcrumbs || breadcrumbs.length === 0) return

    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${siteInfo.baseUrl}${crumb.url}`
      }))
    }

    // Remove existing breadcrumb data
    const existingBreadcrumb = document.querySelector('script[data-type="breadcrumb"]')
    if (existingBreadcrumb) {
      existingBreadcrumb.remove()
    }

    // Add new breadcrumb data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-type', 'breadcrumb')
    script.textContent = JSON.stringify(breadcrumbData)
    document.head.appendChild(script)
    metaTags.value.set('breadcrumb-data', script)
  }

  /**
   * Clean up meta tags when component unmounts
   */
  const cleanup = () => {
    metaTags.value.forEach((tag) => {
      if (tag.parentNode) {
        tag.parentNode.removeChild(tag)
      }
    })
    metaTags.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    setMeta,
    setOpenGraphTags,
    setTwitterCardTags,
    setStructuredData,
    setBreadcrumbStructuredData,
    siteInfo,
    cleanup
  }
}

/**
 * Page-specific SEO configurations
 */
export const pageMeta = {
  home: {
    title: 'Park City Construction & Remodeling Company',
    description: 'Unified Contractors is Park City\'s premier construction company with 25+ years of experience. Custom homes, design services, remodeling, water damage restoration, and emergency services.',
    keywords: 'Park City construction, custom homes, remodeling, water damage restoration, sump pumps, Utah contractors, home building',
    url: '/'
  },
  services: {
    title: 'Construction Services - Custom Homes & Remodeling',
    description: 'Complete construction services in Park City, UT. Custom home building, design services, remodeling, water damage restoration, and sump pump installation. Licensed and insured.',
    keywords: 'construction services, custom home building, remodeling services, water damage restoration, design services, Park City',
    url: '/services'
  },
  about: {
    title: 'About Us - Family-Owned Construction Company',
    description: 'Learn about Unified Contractors, Park City\'s trusted family-owned construction company. 25+ years of experience in custom homes, remodeling, and emergency services.',
    keywords: 'about Unified Contractors, family-owned construction, Park City builders, construction company history',
    url: '/about'
  },
  contact: {
    title: 'Contact Us - Free Construction Estimates',
    description: 'Get your free construction estimate today. Contact Unified Contractors for custom homes, remodeling, and emergency services in Park City, UT. 24/7 emergency response.',
    keywords: 'contact construction company, free estimate, Park City contractors, emergency construction services',
    url: '/contact'
  },
  portfolio: {
    title: 'Our Work - Construction Portfolio & Gallery',
    description: 'View our portfolio of custom homes, remodeling projects, and construction work in Park City, Utah. See the quality craftsmanship that sets Unified Contractors apart.',
    keywords: 'construction portfolio, custom home gallery, remodeling projects, Park City construction work',
    url: '/portfolio'
  }
}