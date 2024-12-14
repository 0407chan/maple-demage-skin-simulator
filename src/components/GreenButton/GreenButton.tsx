import { Button, ConfigProvider } from 'antd'
import { ButtonProps } from 'antd/lib'
import React from 'react'

const GreenButton: React.FC<ButtonProps> = ({ ...props }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#aac632'
        },
        components: {
          Button: {
            colorPrimary: '#aac632'
          }
        }
      }}
    >
      <Button type="primary" {...props}>
        {props.children}
      </Button>
    </ConfigProvider>
  )
}

export default GreenButton
