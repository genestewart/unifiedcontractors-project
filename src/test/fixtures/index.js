// Test fixtures and mock data for consistent testing

// Mock service data
export const mockServices = [
  {
    id: 'custom-homes',
    title: 'Custom Homes',
    description: 'Complete custom home construction services',
    icon: 'pi-home',
    features: ['Design', 'Construction', 'Project Management']
  },
  {
    id: 'design',
    title: 'Design Services', 
    description: 'Professional architectural and interior design',
    icon: 'pi-palette',
    features: ['Architecture', 'Interior Design', '3D Visualization']
  },
  {
    id: 'remodeling',
    title: 'Remodeling',
    description: 'Kitchen, bathroom, and whole home remodeling',
    icon: 'pi-wrench',
    features: ['Kitchen Remodel', 'Bathroom Remodel', 'Whole Home']
  },
  {
    id: 'water-mitigation',
    title: 'Water Mitigation',
    description: 'Water damage restoration and prevention',
    icon: 'pi-shield',
    features: ['Water Extraction', 'Drying', 'Restoration']
  },
  {
    id: 'sump-pumps',
    title: 'Sump Pump Systems',
    description: 'Basement waterproofing and sump pump installation',
    icon: 'pi-cog',
    features: ['Installation', 'Maintenance', 'Emergency Repair']
  }
]

// Mock project portfolio data
export const mockPortfolioProjects = [
  {
    id: 1,
    title: 'Mountain View Custom Home',
    category: 'custom-homes',
    description: 'Luxury custom home with panoramic mountain views',
    image: '/images/projects/mountain-home.jpg',
    images: [
      '/images/projects/mountain-home-1.jpg',
      '/images/projects/mountain-home-2.jpg',
      '/images/projects/mountain-home-3.jpg'
    ],
    completedDate: '2024-06-15',
    size: '4,500 sq ft',
    bedrooms: 4,
    bathrooms: 3.5,
    features: ['Mountain Views', 'Open Floor Plan', 'Gourmet Kitchen', 'Master Suite']
  },
  {
    id: 2,
    title: 'Modern Kitchen Remodel',
    category: 'remodeling',
    description: 'Complete kitchen transformation with modern appliances',
    image: '/images/projects/kitchen-remodel.jpg',
    images: [
      '/images/projects/kitchen-before.jpg',
      '/images/projects/kitchen-after.jpg'
    ],
    completedDate: '2024-04-20',
    features: ['Quartz Countertops', 'Custom Cabinets', 'Island Seating', 'Stainless Appliances']
  },
  {
    id: 3,
    title: 'Basement Water Damage Restoration',
    category: 'water-mitigation',
    description: 'Complete basement restoration after flood damage',
    image: '/images/projects/water-restoration.jpg',
    completedDate: '2024-03-10',
    features: ['Water Extraction', 'Mold Remediation', 'Complete Rebuild', 'Waterproofing']
  }
]

// Mock testimonial data
export const mockTestimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'Park City, UT',
    rating: 5,
    text: 'Unified Contractors exceeded our expectations with our custom home build. Professional, timely, and exceptional quality.',
    project: 'Custom Home Build',
    date: '2024-05-15'
  },
  {
    id: 2,
    name: 'Mike Chen',
    location: 'Summit County, UT',
    rating: 5,
    text: 'The kitchen remodel was completed on time and within budget. The attention to detail was outstanding.',
    project: 'Kitchen Remodel',
    date: '2024-04-20'
  },
  {
    id: 3,
    name: 'Emily Davis',
    location: 'Heber City, UT',
    rating: 5,
    text: 'Quick response for our water damage emergency. They saved our basement and restored it beautifully.',
    project: 'Water Mitigation',
    date: '2024-03-10'
  }
]

// Mock contact form data
export const mockContactFormData = {
  valid: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '435-555-0123',
    service: 'custom-homes',
    message: 'I would like to discuss building a custom home in Park City.',
    budget: '$500,000 - $750,000'
  },
  invalid: {
    name: '',
    email: 'invalid-email',
    phone: '123',
    service: '',
    message: ''
  }
}

// Mock user interaction scenarios
export const mockUserScenarios = {
  mobileUser: {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mobile Safari',
    touchDevice: true
  },
  desktopUser: {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Desktop Chrome',
    touchDevice: false
  },
  tabletUser: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Tablet Safari',
    touchDevice: true
  }
}

// Mock SEO data
export const mockSEOData = {
  home: {
    title: 'Park City Construction & Remodeling Company',
    description: 'Unified Contractors is Park City\'s premier construction company with 25+ years of experience.',
    keywords: ['Park City construction', 'custom homes', 'remodeling', 'contractors'],
    canonical: 'https://unifiedcontractors.com/',
    ogImage: '/images/og-home.jpg'
  },
  services: {
    title: 'Construction Services - Custom Homes & Remodeling',
    description: 'Complete construction services in Park City, UT. Custom home building, design services, remodeling.',
    keywords: ['construction services', 'custom homes', 'remodeling', 'design services'],
    canonical: 'https://unifiedcontractors.com/services',
    ogImage: '/images/og-services.jpg'
  }
}

// Mock error scenarios
export const mockErrorScenarios = {
  networkError: {
    message: 'Network request failed',
    code: 'NETWORK_ERROR',
    status: 0
  },
  serverError: {
    message: 'Internal server error',
    code: 'SERVER_ERROR', 
    status: 500
  },
  validationError: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    status: 400,
    errors: {
      name: 'Name is required',
      email: 'Invalid email format'
    }
  },
  notFoundError: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
    status: 404
  }
}

// Performance benchmarks for testing
// Note: Test environment values are higher due to jsdom and test setup overhead
export const performanceBenchmarks = {
  componentMount: {
    fast: 100, // ms
    acceptable: 500, // Increased for test environment overhead
    slow: 1000     // Increased for complex components in test environment
  },
  routeNavigation: {
    fast: 200,
    acceptable: 500,
    slow: 1000
  },
  apiRequest: {
    fast: 200,
    acceptable: 500,
    slow: 1000
  }
}