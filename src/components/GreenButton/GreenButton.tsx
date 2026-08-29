import { Button, ConfigProvider } from 'antd'
import { ButtonProps } from 'antd/lib'
import React from 'react'

const GreenButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ...props }, ref) => {
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
        <Button ref={ref} type="primary" {...props}>
          {props.children}
        </Button>
      </ConfigProvider>
    )
  }
)

GreenButton.displayName = 'GreenButton'

export default GreenButton
