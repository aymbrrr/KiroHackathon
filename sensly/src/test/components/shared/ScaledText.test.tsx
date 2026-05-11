import React from 'react';
import { render } from '@testing-library/react-native';
import { ScaledText } from '../../../components/shared/ScaledText';

// Mock AccessibilityContext to control fontScale
jest.mock('../../../contexts/AccessibilityContext', () => ({
  useAccessibility: jest.fn(),
}));

import { useAccessibility } from '../../../contexts/AccessibilityContext';

describe('ScaledText', () => {
  it('renders children', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ fontScale: 1.0 });
    const { getByText } = render(<ScaledText>Hello</ScaledText>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('normal mode (scale 1.0) — no fontSize override when no base fontSize', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ fontScale: 1.0 });
    const { getByText } = render(<ScaledText>Text</ScaledText>);
    // No fontSize in style → scaledStyle is {} → no override
    const el = getByText('Text');
    const flatStyle = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style.filter(Boolean))
      : el.props.style ?? {};
    expect(flatStyle.fontSize).toBeUndefined();
  });

  it('large mode (scale 1.25) — scales fontSize', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ fontScale: 1.25 });
    const { getByText } = render(<ScaledText style={{ fontSize: 16 }}>Text</ScaledText>);
    const el = getByText('Text');
    const flatStyle = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style.filter(Boolean))
      : el.props.style ?? {};
    expect(flatStyle.fontSize).toBe(20); // 16 * 1.25
  });

  it('xlarge mode (scale 1.5) — scales fontSize', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ fontScale: 1.5 });
    const { getByText } = render(<ScaledText style={{ fontSize: 16 }}>Text</ScaledText>);
    const el = getByText('Text');
    const flatStyle = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style.filter(Boolean))
      : el.props.style ?? {};
    expect(flatStyle.fontSize).toBe(24); // 16 * 1.5
  });

  it('passes through other style props', () => {
    (useAccessibility as jest.Mock).mockReturnValue({ fontScale: 1.0 });
    const { getByText } = render(
      <ScaledText style={{ color: 'red', fontSize: 14 }}>Text</ScaledText>
    );
    const el = getByText('Text');
    const flatStyle = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style.filter(Boolean))
      : el.props.style ?? {};
    expect(flatStyle.color).toBe('red');
  });
});
