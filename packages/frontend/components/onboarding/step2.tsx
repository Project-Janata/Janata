import { View, Platform } from 'react-native'
import { useOnboarding } from '../contexts'
import BirthdatePicker from '../profile/BirthdatePicker'
import { StepLayout, StepHeading, StepFooter } from './shared'

export default function Step2() {
  const { goToNextStep, birthdate, setBirthdate } = useOnboarding()

  return (
    <StepLayout footer={
      <StepFooter onContinue={goToNextStep} disabled={!birthdate} />
    }>
      <View className="gap-4 w-full max-w-md self-center items-center">
        <StepHeading
          title="When's your birthday?"
          subtitle="We'll use this to personalize your experience."
        />
        <View
          className="mt-8 w-full items-center justify-center"
          style={Platform.OS === 'web' ? { overflow: 'visible', zIndex: 20 } : undefined}
        >
          <BirthdatePicker value={birthdate ?? undefined} onChange={setBirthdate} />
        </View>
      </View>
    </StepLayout>
  )
}
