import React from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

import { CarProvider, useCar } from './contexts/CarContext'
import * as userCarService from './services/userCarService'
import Icon from './components/Icon'

// Ловит любую ошибку React-tree, чтобы вместо белого экрана пользователь
// увидел внятное сообщение и мог перезагрузить страницу.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
    this.setState({ info })
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ padding: '24px', minHeight: '100vh', background: '#F7F8FA', color: '#1E293B', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Что-то пошло не так</div>
        <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px', lineHeight: 1.5 }}>
          Попробуйте перезагрузить страницу. Если повторится — пришлите этот текст:
        </div>
        <pre style={{ fontSize: '11px', color: '#DC2626', background: '#FFFFFF', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '40vh', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {String(this.state.error?.message || this.state.error)}
          {'\n\n'}
          {this.state.error?.stack || ''}
        </pre>
        <button
          onClick={() => { try { localStorage.clear() } catch (e) {}; window.location.href = '/' }}
          style={{ marginTop: '16px', padding: '12px 16px', background: '#1F4FD8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Сбросить и перезагрузить
        </button>
      </div>
    )
  }
}

// Импорт экранов
import Onboarding from './components/Onboarding'
import AddCarForm from './components/AddCarForm'
import Dashboard from './components/Dashboard'
import IssuesScreen from './components/IssuesScreen'
import IssueDetailScreen from './components/IssueDetailScreen'
import JournalScreen from './components/JournalScreen'
import AssistantScreen from './components/AssistantScreen'
import MaintenanceScreen from './components/MaintenanceScreen'
import CostScreen from './components/CostScreen'

// Цветовая схема
export const colors = {
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  
  primary: '#1F4FD8',
  primaryLight: 'rgba(31, 79, 216, 0.08)',
  
  success: '#2E9E6F',
  successLight: 'rgba(46, 158, 111, 0.08)',
  
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',
  
  critical: '#DC2626',
  criticalLight: 'rgba(220, 38, 38, 0.08)',
  
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
}

// Нижняя навигация
const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', icon: 'home', label: 'Главная' },
    { path: '/issues', icon: 'wrench', label: 'Обслуживание' },
    { path: '/journal', icon: 'clipboard', label: 'Журнал' },
    { path: '/assistant', icon: 'chat', label: 'Ассистент' },
  ]

  return (
    <div style={styles.bottomNav}>
      {navItems.map(item => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon name={item.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
            <span style={{ ...styles.navLabel, ...(active ? { color: colors.primary } : {}) }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const shouldShowNav = (pathname) => {
  const noNavRoutes = ['/', '/add-car']
  if (pathname.startsWith('/issues/')) return false
  return !noNavRoutes.includes(pathname)
}

// Сплэш на время загрузки машины из localStorage — нейтральный экран,
// чтобы не мигал онбординг до того, как мы решили, куда вести пользователя.
function Splash() {
  return (
    <div style={styles.splash}>
      <div style={styles.splashLogo}>AAA</div>
    </div>
  )
}

// Что показывать на корневом маршруте «/». Решаем декларативно (без мигания):
// пока грузимся — сплэш; новый пользователь — онбординг; вернувшийся —
// сразу редирект на дашборд / добавление авто.
function RootRoute({ onComplete }) {
  const { userCar, loading } = useCar()
  const hasCompletedOnboarding = userCarService.isOnboardingCompleted()

  if (!hasCompletedOnboarding) return <Onboarding onComplete={onComplete} />
  if (loading) return <Splash />
  return <Navigate to={userCar ? '/dashboard' : '/add-car'} replace />
}

// Внутренний компонент роутинга, имеет доступ к контексту
function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleOnboardingComplete = () => {
    userCarService.markOnboardingCompleted()
    navigate('/add-car')
  }

  const showNav = shouldShowNav(location.pathname)

  return (
    <div style={styles.app}>
      <Routes>
        <Route path="/" element={<RootRoute onComplete={handleOnboardingComplete} />} />
        <Route path="/add-car" element={<AddCarForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/issues" element={<IssuesScreen />} />
        <Route path="/issues/:issueId" element={<IssueDetailScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/maintenance" element={<MaintenanceScreen />} />
        <Route path="/cost" element={<CostScreen />} />
        <Route path="/assistant" element={<AssistantScreen />} />
      </Routes>
      
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <CarProvider>
        <AppRoutes />
      </CarProvider>
    </ErrorBoundary>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: colors.background,
  },

  splash: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.background,
  },
  splashLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: colors.primary,
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px',
    letterSpacing: '1px',
  },
  
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '6px 12px 24px',
    background: colors.cardBg,
    borderTop: `1px solid ${colors.border}`,
    zIndex: 1000,
  },

  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'background 0.15s ease',
  },

  navItemActive: {
    background: colors.primaryLight,
  },

  navIcon: {
    fontSize: '20px',
  },

  navLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: colors.textSecondary,
  },
}
