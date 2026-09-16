// Mock domain data. Replace this module with API responses without changing UI components.
export const MOCK_SERVICES = [
  { id: 'ride', title: 'Ride', description: 'Get a car when you need to move.', icon: 'car', href: '/customer/ride', accent: 'green', image: '/ride.jpg' },
  { id: 'delivery', title: 'Send a package', description: 'Fast pickup and doorstep delivery.', icon: 'package', href: '/customer/book', accent: 'emerald', image: '/pickedup.jpg' },
  { id: 'pickup', title: 'Pickup & drop-off', description: 'Move documents, items and errands.', icon: 'route', href: '/customer/book', accent: 'lime', image: '/deliveryguy.jpg' },
  // { id: 'business', title: 'Business', description: 'Manage recurring trips and deliveries.', icon: 'briefcase', href: '/customer/book', accent: 'slate', image: '/fleet-dashboard.jfif' },
]

export const MOCK_RIDE_OPTIONS = [
  { id: 'economy', name: 'Swifty Go', href:'/taxi.png' ,description: 'Affordable everyday rides', eta: 4, price: 1800, seats: 4 },
  { id: 'comfort', name: 'Swifty Comfort', href:'/electric-car.png' , description: 'Extra space and newer cars', eta: 7, price: 2800, seats: 4 },
  { id: 'xl', name: 'Swifty XL', href:'/sedan.png' , description: 'More room for groups or luggage', eta: 9, price: 3800, seats: 6 },
]

export const MOCK_RIDES = [
  { id: 'SW-R-1021', status: 'in_progress', pickup: 'Lekki Phase 1', dropoff: 'Victoria Island', driver: 'Daniel O.', vehicle: 'Toyota Corolla • KJA 421QF', eta: 6, fare: 3200, createdAt: Date.now() - 12 * 60000 },
  { id: 'SW-R-1014', status: 'completed', pickup: 'Yaba', dropoff: 'Ikeja City Mall', driver: 'Micheal A.', vehicle: 'Honda Accord • KSF 883AA', eta: 0, fare: 4100, createdAt: Date.now() - 86400000 },
]

export const MOCK_DASHBOARD_STATS = [
  { label: 'Active trips', value: '1', detail: '1 ride in progress' },
  { label: 'Deliveries', value: '8', detail: '2 arriving today' },
  { label: 'Saved places', value: '4', detail: 'Home, work & more' },
]
