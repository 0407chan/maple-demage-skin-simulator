import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  padding: 20px;
  padding-left: 4px;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
`

export const SkinButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  border-radius: 5px;
  padding: 8px 16px;
  gap: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  &:hover {
    background-color: #434956;
  }

  .skin-img {
  }
  .skin-text {
    font-weight: bold;
    color: #e1e1e1;
  }
`
