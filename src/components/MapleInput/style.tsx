import { Input as OriginalInput } from 'antd/lib'
import styled from 'styled-components'

export const Input = styled(OriginalInput)`
  width: calc(100% - 30px);
  background-color: #2b2b2bc7;
  color: #f0f0f0;
  border: 1px solid #4f3b11c6;
  &:hover {
    border: 1px solid #9a7320;
  }
  &:focus {
    border: 1px solid #d5a130;
  }
  &:disabled {
    background-color: #c8c8c8;
  }
  &::placeholder {
    color: #808080;
  }
`
