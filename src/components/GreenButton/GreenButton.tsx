import { ButtonProps } from 'antd/lib'
import React from 'react'
import * as S from './style'
const GreenButton: React.FC<ButtonProps> = ({ disabled, ...props }) => {
  return <S.Button disabled={disabled} {...props}></S.Button>
}

export default GreenButton
