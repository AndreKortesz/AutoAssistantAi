import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'

import { CarProvider, useCar } from './contexts/CarContext'
import * as userCarService from './services/userCarService'

// Импорт экранов
import Onboarding from './components/Onboarding'
import AddCarForm from './components/AddCarForm'
import Dashboard from './components/Dashboard'
import IssuesScreen from './components/IssuesScreen'
import IssueDetailScreen from './components/IssueDetailScreen'
import JournalScreen from './components/JournalScreen'
import AssistantScreen from './components/AssistantScreen'

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
    { path: '/dashboard', icon: '🏠', label: 'Главная' },
    { path: '/issues', icon: '⚠️', label: 'Болячки' },
    { path: '/journal', icon: '📋', label: 'Журнал' },
    { path: '/assistant', icon: '💬', label: 'Ассистент' },
  ]
  
  return (
    <div style={styles.bottomNav}>
      {navItems.map(item => (
        <button
          key={item.path}
          style={{
            ...styles.navItem,
            ...(location.pathname === item.path ? styles.navItemActive : {}),
          }}
          onClick={() => navigate(item.path)}
        >
          <span style={styles.navIcon}>{item.icon}</span>
          <span style={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

const shouldShowNav = (pathname) => {
  const noNavRoutes = ['/', '/add-car']
  if (pathname.startsWith('/issues/')) return false
  return !noNavRoutes.includes(pathname)
}

// Внутренний компонент роутинга, имеет доступ к контексту
function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userCar, loading } = useCar()
  
  const hasCompletedOnboarding = userCarService.isOnboardingCompleted()
  
  const handleOnboardingComplete = () => {
    userCarService.markOnboardingCompleted()
    navigate('/add-car')
  }
  
  // Редирект при первом запуске
  useEffect(() => {
    if (loading) return
    if (location.pathname === '/') {
      if (!hasCompletedOnboarding) {
        // Остаёмся на онбординге
      } else if (!userCar) {
        navigate('/add-car')
      } else {
        navigate('/dashboard')
      }
    }
  }, [location.pathname, hasCompletedOnboarding, userCar, loading, navigate])

  const showNav = shouldShowNav(location.pathname)

  return (
    <div style={styles.app}>
      <Routes>
        <Route path="/" element={<Onboarding onComplete={handleOnboardingComplete} />} />
        <Route path="/add-car" element={<AddCarForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/issues" element={<IssuesScreen />} />
        <Route path="/issues/:issueId" element={<IssueDetailScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/assistant" element={<AssistantScreen />} />
      </Routes>
      
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <CarProvider>
      <AppRoutes />
    </CarProvider>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: colors.background,
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
