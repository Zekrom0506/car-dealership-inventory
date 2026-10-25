import { BrowserRouter } from 'react-router'
import { AppRoutes } from './AppRoutes'
import { AuthProvider } from './auth/AuthProvider'

/** The whole app: auth state + browser routing + routes. */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
