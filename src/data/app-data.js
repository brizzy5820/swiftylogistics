export const SERVICES = [
  { id: 'ride', title: 'Ride', description: 'Get a car when you need to move.', icon: 'car', href: '/customer/ride', accent: 'green', image: '/ride.jpg' },
  { id: 'delivery', title: 'Send a package', description: 'Fast pickup and doorstep delivery.', icon: 'package', href: '/customer/book', accent: 'emerald', image: '/pickedup.jpg' },
  { id: 'pickup', title: 'Pickup & drop-off', description: 'Move documents, items and errands.', icon: 'route', href: '/customer/book', accent: 'lime', image: '/deliveryguy.jpg' },
]
export const RIDE_OPTIONS = [
  { id: 'economy', name: 'Swifty Go', href: '/taxi.png', description: 'Affordable everyday rides', eta: 4, basePrice: 1800, minPrice: 1500, maxPrice: 3000, seats: 4, pricePerKm: 150 },
  { id: 'comfort', name: 'Swifty Comfort', href: '/electric-car.png', description: 'Extra space and newer cars', eta: 7, basePrice: 2800, minPrice: 2200, maxPrice: 4500, seats: 4, pricePerKm: 200 },
  { id: 'xl', name: 'Swifty XL', href: '/sedan.png', description: 'More room for groups or luggage', eta: 9, basePrice: 3800, minPrice: 3000, maxPrice: 6000, seats: 6, pricePerKm: 250 },
]
