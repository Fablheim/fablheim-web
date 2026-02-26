import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fablheim:onboarding';

interface OnboardingState {
  tourCompleted: boolean;
  checklistDismissed: boolean;
  completedSteps: string[];
}

const DEFAULT_STATE: OnboardingState = {
  tourCompleted: false,
  checklistDismissed: false,
  completedSteps: [],
};

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useFirstTimeUser() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const isFirstTime = !state.tourCompleted;
  const showChecklist = state.tourCompleted && !state.checklistDismissed;

  const completeTour = useCallback(() => {
    setState((prev) => ({ ...prev, tourCompleted: true }));
  }, []);

  const dismissChecklist = useCallback(() => {
    setState((prev) => ({ ...prev, checklistDismissed: true }));
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
    }));
  }, []);

  const isStepCompleted = useCallback(
    (stepId: string) => state.completedSteps.includes(stepId),
    [state.completedSteps],
  );

  const resetOnboarding = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    isFirstTime,
    showChecklist,
    completedSteps: state.completedSteps,
    completeTour,
    dismissChecklist,
    completeStep,
    isStepCompleted,
    resetOnboarding,
  };
}
