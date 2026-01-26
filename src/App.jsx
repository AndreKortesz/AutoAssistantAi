import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'

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

// Проверяем, показывать ли нижнюю навигацию
const shouldShowNav = (pathname) => {
  const noNavRoutes = ['/', '/add-car']
  // Скрываем навигацию на детальной странице болячки
  if (pathname.startsWith('/issues/')) return false
  return !noNavRoutes.includes(pathname)
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Проверяем, прошёл ли пользователь онбординг
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('onboardingCompleted') === 'true'
  })
  
  // Проверяем, добавлен ли автомобиль
  const [hasCar, setHasCar] = useState(() => {
    return localStorage.getItem('userCar') !== null
  })

  // Обработчик завершения онбординга
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    setHasCompletedOnboarding(true)
    navigate('/add-car')
  }

  // Обработчик добавления автомобиля
  const handleCarAdded = (carData) => {
    localStorage.setItem('userCar', JSON.stringify(carData))
    setHasCar(true)
    navigate('/dashboard')
  }

  // Редирект при первом запуске
  useEffect(() => {
    if (location.pathname === '/') {
      if (!hasCompletedOnboarding) {
        // Остаёмся на онбординге
      } else if (!hasCar) {
        navigate('/add-car')
      } else {
        navigate('/dashboard')
      }
    }
  }, [location.pathname, hasCompletedOnboarding, hasCar, navigate])

  const showNav = shouldShowNav(location.pathname)

  return (
    <div style={styles.app}>
      <Routes>
        {/* Онбординг */}
        <Route 
          path="/" 
          element={<Onboarding onComplete={handleOnboardingComplete} />} 
        />
        
        {/* Добавление авто */}
        <Route 
          path="/add-car" 
          element={<AddCarForm onComplete={handleCarAdded} />} 
        />
        
        {/* Основные экраны */}
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
