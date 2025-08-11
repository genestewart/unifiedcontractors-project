/**
 * Accessibility composable for focus management and screen reader utilities
 * Provides utilities for better keyboard navigation and assistive technology support
 */
export function useAccessibility() {
  // Reserved for future focus management features
  // const focusableElements = ref([])
  // const currentFocusIndex = ref(0)

  // CSS selector for focusable elements
  const focusableSelector = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
  ].join(',')

  /**
   * Get all focusable elements within a container
   * @param {Element} container - Container element to search within
   * @returns {NodeList} List of focusable elements
   */
  const getFocusableElements = (container = document) => {
    return container.querySelectorAll(focusableSelector)
  }

  /**
   * Focus the first focusable element in a container
   * @param {Element|string} container - Container element or selector
   */
  const focusFirst = (container) => {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container

    if (!containerEl) return

    const focusable = getFocusableElements(containerEl)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  /**
   * Focus the last focusable element in a container
   * @param {Element|string} container - Container element or selector
   */
  const focusLast = (container) => {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container

    if (!containerEl) return

    const focusable = getFocusableElements(containerEl)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus()
    }
  }

  /**
   * Trap focus within a container (useful for modals/dropdowns)
   * @param {Element|string} container - Container element or selector
   * @param {KeyboardEvent} event - Keyboard event
   */
  const trapFocus = (container, event) => {
    if (event.key !== 'Tab') return

    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container

    if (!containerEl) return

    const focusable = Array.from(getFocusableElements(containerEl))
    const firstFocusable = focusable[0]
    const lastFocusable = focusable[focusable.length - 1]

    if (event.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }
  }

  /**
   * Set focus to an element and make it focusable if needed
   * @param {Element|string} element - Element or selector to focus
   * @param {Object} options - Focus options
   */
  const setFocus = (element, options = {}) => {
    const el = typeof element === 'string' 
      ? document.querySelector(element) 
      : element

    if (!el) return

    // Make element focusable if it's not naturally focusable
    if (el.tabIndex < 0) {
      el.tabIndex = -1
    }

    // Focus the element
    el.focus(options)

    // Optional: Remove tabindex after focus if it was added
    if (options.removeTempTabindex) {
      setTimeout(() => {
        if (el.tabIndex === -1) {
          el.removeAttribute('tabindex')
        }
      }, 100)
    }
  }

  /**
   * Announce text to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level: 'polite' or 'assertive'
   */
  const announce = (message, priority = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove the announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Create a roving tabindex for arrow key navigation
   * @param {string} containerSelector - Container selector
   * @param {string} itemSelector - Item selector within container
   * @param {Object} options - Options for roving tabindex
   */
  const createRovingTabindex = (containerSelector, itemSelector, options = {}) => {
    const {
      orientation = 'horizontal', // 'horizontal' or 'vertical' or 'both'
      wrap = true, // Whether to wrap around at ends
      initialIndex = 0 // Initial focused item index
    } = options

    const container = document.querySelector(containerSelector)
    if (!container) return

    const items = Array.from(container.querySelectorAll(itemSelector))
    if (items.length === 0) return

    let currentIndex = initialIndex

    // Set initial tabindexes
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1
    })

    const handleKeyDown = (event) => {
      let newIndex = currentIndex

      const isHorizontal = orientation === 'horizontal' || orientation === 'both'
      const isVertical = orientation === 'vertical' || orientation === 'both'

      switch (event.key) {
        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault()
            newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1)
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault()
            newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0)
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault()
            newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1)
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault()
            newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0)
          }
          break
        case 'Home':
          event.preventDefault()
          newIndex = 0
          break
        case 'End':
          event.preventDefault()
          newIndex = items.length - 1
          break
      }

      if (newIndex !== currentIndex) {
        // Update tabindexes
        items[currentIndex].tabIndex = -1
        items[newIndex].tabIndex = 0
        items[newIndex].focus()
        currentIndex = newIndex
      }
    }

    // Add event listener to container
    container.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if user prefers reduced motion
   */
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Check if user is using high contrast mode
   * @returns {boolean} True if high contrast mode is active
   */
  const isHighContrast = () => {
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  /**
   * Get the current device type for accessibility adaptations
   * @returns {string} Device type: 'touch', 'keyboard', or 'mouse'
   */
  const getInputMethod = () => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return 'touch'
    }
    if (window.matchMedia('(any-hover: none)').matches) {
      return 'touch'
    }
    return 'mouse' // Default fallback
  }

  /**
   * Add aria-expanded toggle functionality
   * @param {Element|string} trigger - Trigger element
   * @param {Element|string} target - Target element to expand/collapse
   */
  const createExpandableRegion = (trigger, target) => {
    const triggerEl = typeof trigger === 'string' 
      ? document.querySelector(trigger) 
      : trigger
    const targetEl = typeof target === 'string' 
      ? document.querySelector(target) 
      : target

    if (!triggerEl || !targetEl) return

    const isExpanded = () => triggerEl.getAttribute('aria-expanded') === 'true'

    const toggle = () => {
      const expanded = !isExpanded()
      triggerEl.setAttribute('aria-expanded', expanded.toString())
      targetEl.setAttribute('aria-hidden', (!expanded).toString())
      
      if (expanded) {
        focusFirst(targetEl)
      }
    }

    triggerEl.addEventListener('click', toggle)
    triggerEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggle()
      }
    })

    // Set initial ARIA attributes
    if (!triggerEl.hasAttribute('aria-expanded')) {
      triggerEl.setAttribute('aria-expanded', 'false')
    }
    if (!targetEl.hasAttribute('aria-hidden')) {
      targetEl.setAttribute('aria-hidden', 'true')
    }
  }

  /**
   * Manage page title for screen readers
   * @param {string} title - New page title
   * @param {boolean} announce - Whether to announce the title change
   */
  const setPageTitle = (title, announce = true) => {
    document.title = title
    
    if (announce) {
      // Announce page change to screen readers
      setTimeout(() => {
        this.announce(`Page changed to ${title}`, 'polite')
      }, 100)
    }
  }

  return {
    // Focus management
    getFocusableElements,
    focusFirst,
    focusLast,
    trapFocus,
    setFocus,
    
    // Screen reader utilities
    announce,
    setPageTitle,
    
    // Advanced interactions
    createRovingTabindex,
    createExpandableRegion,
    
    // Environment detection
    prefersReducedMotion,
    isHighContrast,
    getInputMethod
  }
}

/**
 * Vue directive for automatic focus management
 * Usage: v-auto-focus="shouldFocus"
 */
export const vAutoFocus = {
  mounted(el, binding) {
    if (binding.value) {
      setTimeout(() => {
        el.focus()
      }, 100)
    }
  },
  updated(el, binding) {
    if (binding.value && !binding.oldValue) {
      setTimeout(() => {
        el.focus()
      }, 100)
    }
  }
}

/**
 * Vue directive for focus trap
 * Usage: v-focus-trap="isActive"
 */
export const vFocusTrap = {
  mounted(el, binding) {
    if (binding.value) {
      const { trapFocus } = useAccessibility()
      
      const handleKeydown = (event) => {
        trapFocus(el, event)
      }
      
      el.addEventListener('keydown', handleKeydown)
      el._focusTrapHandler = handleKeydown
    }
  },
  updated(el, binding) {
    if (binding.value && !binding.oldValue && el._focusTrapHandler) {
      el.addEventListener('keydown', el._focusTrapHandler)
    } else if (!binding.value && binding.oldValue && el._focusTrapHandler) {
      el.removeEventListener('keydown', el._focusTrapHandler)
    }
  },
  unmounted(el) {
    if (el._focusTrapHandler) {
      el.removeEventListener('keydown', el._focusTrapHandler)
      delete el._focusTrapHandler
    }
  }
}