export const SERVICES = [
  { id: 'ride', title: 'Ride', description: 'Get a car when you need to move.', icon: 'car', href: '/customer/ride', accent: 'green', image: '/ride.png' },
  { id: 'delivery', title: 'Send a package', description: 'Fast pickup and doorstep delivery.', icon: 'package', href: '/customer/book', accent: 'emerald', image: '/pickedup.png' },
  { id: 'pickup', title: 'Pickup & drop-off', description: 'Move documents, items and errands.', icon: 'route', href: '/customer/book', accent: 'lime', image: '/deliveryguy.png' },
]
export const RIDE_OPTIONS = [
  { id: 'economy', name: 'Swifty Go', href: '/taxi.png', description: 'Affordable everyday rides', eta: 4, price: 1800, seats: 4 },
  { id: 'comfort', name: 'Swifty Comfort', href: '/electric-car.png', description: 'Extra space and newer cars', eta: 7, price: 2800, seats: 4 },
  { id: 'xl', name: 'Swifty XL', href: '/sedan.png', description: 'More room for groups or luggage', eta: 9, price: 3800, seats: 6 },
]
