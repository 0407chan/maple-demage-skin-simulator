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
      const version = wzVersionData
        .filter((item) => item.region === "KMST")
        .at(-1)?.mapleVersionId

      console.log(`current version: KMST`, version)

      if (version !== undefined) {
        setWzVersion({ version: Number(version), region: "KMST" })
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

  if (currentPath === '#mapping') {
    return <MappingTool />
  }

  return <App />
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ConfigProvider theme={antdTheme}>
          <Router />
        </ConfigProvider>
      </RecoilRoot>
    </QueryClientProvider>
  </React.StrictMode>
)
