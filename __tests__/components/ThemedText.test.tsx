/**
 * Component Test: ThemedText
 * Purpose: Validate React Native Testing Library 13.3.3 works with React 19
 * This test demonstrates using the custom render function with ThemeProvider
 */

import React from 'react';
import { render, screen } from '@/test-utils';
import ThemedText from '@/components/ThemedText';

describe('ThemedText', () => {
  it('should render with text', () => {
    render(<ThemedText>Hello World</ThemedText>);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should render with default variant', () => {
    const { getByText } = render(<ThemedText>Default Text</ThemedText>);
    expect(getByText('Default Text')).toBeTruthy();
  });

  it('should render with title variant', () => {
    const { getByText } = render(<ThemedText variant="title">Title Text</ThemedText>);
    expect(getByText('Title Text')).toBeTruthy();
  });

  it('should render with subtitle variant', () => {
    const { getByText } = render(<ThemedText variant="subtitle">Subtitle Text</ThemedText>);
    expect(getByText('Subtitle Text')).toBeTruthy();
  });

  it('should render with caption variant', () => {
    const { getByText } = render(<ThemedText variant="caption">Caption Text</ThemedText>);
    expect(getByText('Caption Text')).toBeTruthy();
  });
});
