import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { SensoryBudgetBanner } from '../../../components/sensing/SensoryBudgetBanner';

const mockImpactAsync = jest.fn();

jest.mock('expo-haptics', () => ({
  impactAsync: (style: any) => mockImpactAsync(style),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

jest.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

import { useSettingsStore } from '../../../stores/settingsStore';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (useSettingsStore as jest.Mock).mockReturnValue({ uiMode: 'support' });
});

afterEach(() => jest.useRealTimers());

describe('SensoryBudgetBanner', () => {
  it('renders nothing in self mode', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({ uiMode: 'self' });
    const { toJSON } = render(<SensoryBudgetBanner currentDb={80} threshold={60} />);
    expect(toJSON()).toBeNull();
  });

  it('does not show banner when below threshold', () => {
    const { queryByText } = render(<SensoryBudgetBanner currentDb={50} threshold={60} />);
    expect(queryByText(/noise/i)).toBeNull();
  });

  it('shows banner in support mode after 5s above threshold', async () => {
    const { queryByText } = render(<SensoryBudgetBanner currentDb={80} threshold={60} />);
    act(() => jest.advanceTimersByTime(5000));
    await waitFor(() => expect(queryByText(/80 dB/)).toBeTruthy());
  });

  it('haptic fires on alert — always Light, never Heavy', async () => {
    render(<SensoryBudgetBanner currentDb={80} threshold={60} />);
    act(() => jest.advanceTimersByTime(5000));
    await waitFor(() => expect(mockImpactAsync).toHaveBeenCalled());
    expect(mockImpactAsync).toHaveBeenCalledWith('Light');
    expect(mockImpactAsync).not.toHaveBeenCalledWith('Heavy');
    expect(mockImpactAsync).not.toHaveBeenCalledWith('Medium');
  });

  it('dismiss button hides banner', async () => {
    const { queryByText, getByLabelText } = render(
      <SensoryBudgetBanner currentDb={80} threshold={60} />
    );
    act(() => jest.advanceTimersByTime(5000));
    await waitFor(() => expect(queryByText(/80 dB/)).toBeTruthy());
    fireEvent.press(getByLabelText('Dismiss noise alert'));
    await waitFor(() => expect(queryByText(/80 dB/)).toBeNull());
  });

  it('clears timer when dB drops below threshold mid-alert', () => {
    const { rerender } = render(<SensoryBudgetBanner currentDb={80} threshold={60} />);
    act(() => jest.advanceTimersByTime(2000));
    rerender(<SensoryBudgetBanner currentDb={50} threshold={60} />);
    act(() => jest.advanceTimersByTime(5000));
    // Timer was cleared — haptic should not have fired
    expect(mockImpactAsync).not.toHaveBeenCalled();
  });
});
