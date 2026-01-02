'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  OnboardingStep1Input,
  OnboardingStep2Input,
  OnboardingContactInput,
  OnboardingAddressInput,
} from '@/lib/validations/dealer'

export type OnboardingData = {
  step1: Partial<OnboardingStep1Input>
  step2: Partial<OnboardingStep2Input>
  step3: {
    contacts: OnboardingContactInput[]
    addresses: OnboardingAddressInput[]
  }
}

type OnboardingContextType = {
  currentStep: number
  totalSteps: number
  data: OnboardingData
  updateStep1: (data: Partial<OnboardingStep1Input>) => void
  updateStep2: (data: Partial<OnboardingStep2Input>) => void
  updateStep3: (data: { contacts?: OnboardingContactInput[]; addresses?: OnboardingAddressInput[] }) => void
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  canGoNext: boolean
  canGoPrev: boolean
  isLastStep: boolean
  resetWizard: () => void
}

const defaultData: OnboardingData = {
  step1: {
    code: '',
    name: '',
    tier: 'bronze',
    parentDealerId: null,
  },
  step2: {
    ein: '',
    licenseNumber: '',
    insurancePolicy: '',
  },
  step3: {
    contacts: [],
    addresses: [],
  },
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(defaultData)
  const totalSteps = 4

  const updateStep1 = useCallback((stepData: Partial<OnboardingStep1Input>) => {
    setData((prev) => ({
      ...prev,
      step1: { ...prev.step1, ...stepData },
    }))
  }, [])

  const updateStep2 = useCallback((stepData: Partial<OnboardingStep2Input>) => {
    setData((prev) => ({
      ...prev,
      step2: { ...prev.step2, ...stepData },
    }))
  }, [])

  const updateStep3 = useCallback(
    (stepData: { contacts?: OnboardingContactInput[]; addresses?: OnboardingAddressInput[] }) => {
      setData((prev) => ({
        ...prev,
        step3: {
          contacts: stepData.contacts ?? prev.step3.contacts,
          addresses: stepData.addresses ?? prev.step3.addresses,
        },
      }))
    },
    []
  )

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step)
      }
    },
    [totalSteps]
  )

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, totalSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const resetWizard = useCallback(() => {
    setCurrentStep(1)
    setData(defaultData)
  }, [])

  const value: OnboardingContextType = {
    currentStep,
    totalSteps,
    data,
    updateStep1,
    updateStep2,
    updateStep3,
    goToStep,
    nextStep,
    prevStep,
    canGoNext: currentStep < totalSteps,
    canGoPrev: currentStep > 1,
    isLastStep: currentStep === totalSteps,
    resetWizard,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
