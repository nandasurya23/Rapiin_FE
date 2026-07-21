import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { AppDataProvider } from "@/components/providers/app-data-provider";

export default function OnboardingPage() {
 return (
  <AppDataProvider>
   <OnboardingFlow />
  </AppDataProvider>
 );
}
