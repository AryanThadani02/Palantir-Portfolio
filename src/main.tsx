import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FILM_MODE, exitFilmOnInput } from './lib/film'
import './styles.css'
import './chapters.css'

if (FILM_MODE) document.documentElement.classList.add('film')
exitFilmOnInput()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
