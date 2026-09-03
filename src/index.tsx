import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { antdTheme } from 'config/antd-theme'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { RecoilRoot, useRecoilState } from 'recoil'
import App from './App'
import { MappingTool } from './pages/MappingTool'
import './styles/globals.scss'
import { useGetWzVersion } from './api/damage-skin'
import { wzVersionState } from './atoms/wzVersion'
import { RegionType } from 'type/wz'
import { getLatestReadyWzVersion } from 'utils/wzVersion'
import { initializeAnalytics } from 'utils/analytics'
import { I18nProvider } from 'i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash)
  const [_, setWzVersion] = useRecoilState(wzVersionState)
  const { data: wzVersionData } = useGetWzVersion()

  useEffect(() => {
    if (wzVersionData) {
      const region: RegionType = 'KMS'
      const latestVersion = getLatestReadyWzVersion(wzVersionData, region)
      const version = latestVersion?.numericVersion

      console.log(`current version: ${region}`, version)

      if (version !== undefined) {
        setWzVersion({ version, region })
      }
    }
  }, [wzVersionData, setWzVersion])

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (currentPath === '#mapping' && import.meta.env.DEV) {
    return <MappingTool />
  }

  return <App />
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

initializeAnalytics()

root.render(
  <React.StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <ConfigProvider theme={antdTheme}>
            <Router />
          </ConfigProvider>
        </RecoilRoot>
      </QueryClientProvider>
    </I18nProvider>
  </React.StrictMode>
)
