import { Cormorant_Garamond, Outfit, Parisienne } from 'next/font/google'

// Équivalents libres des trois polices de marque (TAN Angleton, Black Mango,
// Amsterdam One) : ces dernières sont sous licence commerciale print/Canva
// uniquement, sans licence web. Tant que ce point n'est pas réglé (voir
// project/README.md du système de marque), le site utilise ces trois-là.

export const titre = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-titre',
  display: 'swap',
})

export const texte = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-texte',
  display: 'swap',
})

export const signature = Parisienne({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-signature',
  display: 'swap',
})
