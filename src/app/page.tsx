import PremiumHeroSection from '@/components/premium/PremiumHeroSection'
import ProblemSolutionSection from '@/components/premium/ProblemSolutionSection'
import InteractiveFeaturesSection from '@/components/premium/InteractiveFeaturesSection'
import PremiumTestimonialsSection from '@/components/premium/PremiumTestimonialsSection'

export default function Home() {
  return (
    <main className="min-h-screen">
      <PremiumHeroSection />
      <ProblemSolutionSection />
      <InteractiveFeaturesSection />
      <PremiumTestimonialsSection />
    </main>
  )
}