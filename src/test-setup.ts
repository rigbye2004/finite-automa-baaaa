import '@testing-library/jest-dom'

// Mock import.meta.env.BASE_URL for withBase utility
Object.defineProperty(import.meta, 'env', {
  value: { BASE_URL: '/' },
  writable: true,
})
