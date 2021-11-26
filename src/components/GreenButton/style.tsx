import { Button as OriginalButton } from 'antd/lib'
import styled from 'styled-components'

const orange0 = '#fff8ed'
const orange1 = '#ffc96b'
const orange2 = '#f4af38'
const orange3 = '#9a722e'
const orange4 = '#948c7d'
const orange5 = '#635949'
const orange6 = '#443f38'

const green0 = '#f6ffd0'
const green1 = '#bbd839'
const green2 = '#aac632'
const green3 = '#7f9326'
const green4 = '#7c8261'
const green5 = '#616747'
const green6 = '#4d513f'

export const Button = styled(OriginalButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  flex-direction: row;
  gap: 10px;
  border: 1px solid ${green3};
  color: ${green0};
  font-weight: bold;
  background-color: ${green2};
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    color: ${green0};
    background-color: ${green1};
    border: 1px solid ${green3};
  }
  &[disabled] {
    color: ${green4};
    background-color: ${green5};
    border: 1px solid ${green6};
    cursor: not-allowed;

    img {
      filter: grayscale(0.8);
    }
    &:hover {
      color: ${green4};
      background-color: ${green5};
      border: 1px solid ${green6};
      cursor: not-allowed;
    }
  }

  &:focus {
    color: ${green0};
    background-color: ${green1};
    border: 1px solid ${green3};
  }
`
