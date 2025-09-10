import { Metadata } from 'next'
import Hero from '@/components/Hero'
import FeatureGrid from '@/components/FeatureGrid'
import FAQAccordion from '@/components/FAQAccordion'
import Contact from '@/components/Contact'

export const metadata: Metadata = {
  title: 'E-Community — Connect · Engage · Decide',
  description: 'Transparent, secure community engagement platform for barangays, condos, schools and businesses.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <FAQAccordion />
      <Contact />
    </>
  )
}