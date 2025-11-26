import { Metadata } from 'next'
import Hero from '@/components/Hero'
import FeatureGrid from '@/components/FeatureGrid'
import AboutUs from '@/components/AboutUs'
import FAQAccordion from '@/components/FAQAccordion'
import Contact from '@/components/Contact'
// Add this to your main layout temporarily
import { RoleDebug } from '@/components/RoleDebug'

// Then add <RoleDebug /> somewhere in your JSX
export const metadata: Metadata = {
  title: 'E-Community — Connect · Engage · Decide',
  description: 'Transparent, secure community engagement platform for barangays, condos, schools and businesses.',
}

export default function HomePage() {
  return (
    <>
      <RoleDebug />
      <Hero />
      <FeatureGrid />
      <AboutUs />
      <FAQAccordion />
      <Contact />
    </>
  )
}
