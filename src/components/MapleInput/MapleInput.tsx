import { InputProps } from 'antd/lib'
import React from 'react'
import * as S from './style'

const MapleInput: React.FC<InputProps> = ({ disabled, ...props }) => {
  return <S.Input disabled={disabled} {...props}></S.Input>
}

export default MapleInput
