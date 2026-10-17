import { useRequireAdmin } from '../../lib/use-require-admin'
import { BrandLoader } from '../brand-loader'

export function AdminRoute({ children }) {
  const user = useRequireAdmin()

  if (!user) {
    return <BrandLoader />
  }

  return children
}

export default AdminRoute
