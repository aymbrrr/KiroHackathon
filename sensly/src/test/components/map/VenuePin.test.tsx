import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VenuePin } from '../../../components/map/VenuePin';
import type { Venue } from '../../../stores/venueStore';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    Marker: ({ children, onPress, accessibilityLabel }: any) => (
      <View onTouchEnd={onPress} accessibilityLabel={accessibilityLabel} testID="marker">
        {children}
      </View>
    ),
  };
});

// ScaledText mock
jest.mock('../../../components/shared/ScaledText', () => {
  const { Text } = require('react-native');
  return { ScaledText: ({ children, ...p }: any) => <Text {...p}>{children}</Text> };
});

const makeVenue = (overall_score: number | null): Venue => ({
  id: 'v1', osm_id: null, name: 'Blue Bottle Coffee', category: 'cafe',
  lat: 35.28, lng: -120.66, address: null,
  avg_noise_db: null, avg_lighting: null, avg_crowding: null,
  avg_smell: null, avg_predictability: null,
  overall_score, total_ratings: 0, quiet_hours: null, sensory_features: null,
});

/** Flatten a RN style prop (array or object) into a plain object */
function flatStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
  return style;
}

function findViewWithBg(root: any, color: string): boolean {
  if (!root) return false;
  if (root.type === 'View' && flatStyle(root.props?.style).backgroundColor === color) return true;
  const children = root.children ?? [];
  return children.some((c: any) => findViewWithBg(c, color));
}

describe('VenuePin', () => {
  it('score ≤ 2.4 → blue background (calm)', () => {
    const { toJSON } = render(<VenuePin venue={makeVenue(1.0)} onPress={jest.fn()} />);
    expect(findViewWithBg(toJSON(), '#0077BB')).toBe(true);
  });

  it('score 2.5–3.4 → orange background (moderate)', () => {
    const { toJSON } = render(<VenuePin venue={makeVenue(3.0)} onPress={jest.fn()} />);
    expect(findViewWithBg(toJSON(), '#EE7733')).toBe(true);
  });

  it('score ≥ 3.5 → red background (loud)', () => {
    const { toJSON } = render(<VenuePin venue={makeVenue(4.0)} onPress={jest.fn()} />);
    expect(findViewWithBg(toJSON(), '#CC3311')).toBe(true);
  });

  it('null score → moderate (orange)', () => {
    const { toJSON } = render(<VenuePin venue={makeVenue(null)} onPress={jest.fn()} />);
    expect(findViewWithBg(toJSON(), '#EE7733')).toBe(true);
  });

  it('accessibilityLabel includes venue name and level', () => {
    const { getByTestId } = render(<VenuePin venue={makeVenue(1.0)} onPress={jest.fn()} />);
    const label = getByTestId('marker').props.accessibilityLabel;
    expect(label).toContain('Blue Bottle Coffee');
    expect(label).toContain('Sensory-friendly');
  });

  it('onPress called with venue', () => {
    const onPress = jest.fn();
    const venue = makeVenue(3.0);
    const { getByTestId } = render(<VenuePin venue={venue} onPress={onPress} />);
    fireEvent(getByTestId('marker'), 'touchEnd');
    expect(onPress).toHaveBeenCalledWith(venue);
  });
});
