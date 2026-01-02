'use client'

import { OnboardingProvider, useOnboarding } from './OnboardingContext'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2BusinessDetails } from './Step2BusinessDetails'
import { Step3Contacts } from './Step3Contacts'
import { Step4Review } from './Step4Review'

type Props = {
  parentDealers: { id: string; name: string; code: string }[]
}

const steps = [
  { id: 1, name: 'Basic Info', description: 'Dealer code and name' },
  { id: 2, name: 'Business Details', description: 'EIN and licenses' },
  { id: 3, name: 'Contacts', description: 'People and addresses' },
  { id: 4, name: 'Review', description: 'Confirm and submit' },
]

function StepIndicator() {
  const { currentStep, goToStep } = useOnboarding()

  return (
    <nav aria-label="Progress">
      <ol className="divide-y divide-gray-200 rounded-md border border-gray-200 md:flex md:divide-y-0">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {step.id < currentStep ? (
              <button
                onClick={() => goToStep(step.id)}
                className="group flex w-full items-center"
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-800">
                    <svg
                      className="h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                </span>
              </button>
            ) : step.id === currentStep ? (
              <div className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600">
                  <span className="text-blue-600">{step.id}</span>
                </span>
                <span className="ml-4 text-sm font-medium text-blue-600">{step.name}</span>
              </div>
            ) : (
              <div className="flex items-center px-6 py-4 text-sm font-medium">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                  <span className="text-gray-500">{step.id}</span>
                </span>
                <span className="ml-4 text-sm font-medium text-gray-500">{step.name}</span>
              </div>
            )}

            {stepIdx !== steps.length - 1 && (
              <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                <svg
                  className="h-full w-full text-gray-300"
                  viewBox="0 0 22 80"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 -2L20 40L0 82"
                    vectorEffect="non-scaling-stroke"
                    stroke="currentcolor"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function StepContent({ parentDealers }: Props) {
  const { currentStep } = useOnboarding()

  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      {currentStep === 1 && <Step1BasicInfo parentDealers={parentDealers} />}
      {currentStep === 2 && <Step2BusinessDetails />}
      {currentStep === 3 && <Step3Contacts />}
      {currentStep === 4 && <Step4Review parentDealers={parentDealers} />}
    </div>
  )
}

export function OnboardingWizard({ parentDealers }: Props) {
  return (
    <OnboardingProvider>
      <StepIndicator />
      <StepContent parentDealers={parentDealers} />
    </OnboardingProvider>
  )
}
