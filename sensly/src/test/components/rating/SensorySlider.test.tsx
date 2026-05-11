import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SensorySlider, SliderOption } from '../../../components/rating/SensorySlider';

// ScaledText uses AccessibilityContext — mock it to render plain Text
jest.mock('../../../components/shared/ScaledText', () => {
  const { Text } = require('react-native');
  return { ScaledText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

const options: SliderOption[] = [
  { value: 1, icon: '😌', label: 'Very quiet' },
  { value: 2, icon: '🔉', label: 'Quiet' },
  { value: 3, icon: '🔊', label: 'Moderate' },
  { value: 4, icon: '📢', label: 'Loud' },
  { value: 5, icon: '🚨', label: 'Very loud' },
];

describe('SensorySlider', () => {
  it('renders all 5 options', () => {
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={null} onChange={jest.fn()} />
    );
    expect(getAllByRole('radio')).toHaveLength(5);
  });

  it('selected option has accessibilityState.selected: true', () => {
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={3} onChange={jest.fn()} />
    );
    const radios = getAllByRole('radio');
    const selected = radios.filter(r => r.props.accessibilityState?.selected === true);
    expect(selected).toHaveLength(1);
  });

  it('unselected options have selected: false', () => {
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={3} onChange={jest.fn()} />
    );
    const radios = getAllByRole('radio');
    const unselected = radios.filter(r => r.props.accessibilityState?.selected === false);
    expect(unselected).toHaveLength(4);
  });

  it('null value → no option selected', () => {
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={null} onChange={jest.fn()} />
    );
    const radios = getAllByRole('radio');
    expect(radios.every(r => r.props.accessibilityState?.selected === false)).toBe(true);
  });

  it('calls onChange with correct value on press', () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={null} onChange={onChange} />
    );
    fireEvent.press(getAllByRole('radio')[2]); // index 2 = value 3
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('accessibilityLabel includes dimension name and option label', () => {
    const { getAllByRole } = render(
      <SensorySlider label="Noise" options={options} value={null} onChange={jest.fn()} />
    );
    const labels = getAllByRole('radio').map(r => r.props.accessibilityLabel);
    expect(labels[2]).toBe('Noise: Moderate');
  });
});
