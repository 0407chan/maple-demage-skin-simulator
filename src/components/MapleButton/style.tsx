import { Button as OriginalButton } from 'antd/lib'
import styled from 'styled-components'

export const Button = styled(OriginalButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  flex-direction: row;
  gap: 10px;
  border: 1px solid #9a722e;
  color: #fff8ed;
  background-color: #f4af38;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    color: #fff8ed;
    background-color: #ffc96b;
    border: 1px solid #9a722e;
  }
  &[disabled] {
    color: #948c7d;
    background-color: #635949;
    border: 1px solid #443f38;
    cursor: not-allowed;

    img {
      filter: grayscale(0.8);
    }
    &:hover {
      color: #948c7d;
      background-color: #635949;
      border: 1px solid #443f38;
      cursor: not-allowed;
    }
  }

  &:focus {
    color: #fff8ed;
    background-color: #ffc96b;
    border: 1px solid #9a722e;
  }
`
