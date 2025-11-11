import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutChangeEvent, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type IconComponentType = React.ComponentType<{ size?: number; color?: string }>;

export interface AnimatedNavItem {
  label: string;
  icon: IconComponentType;
  onPress?: () => void;
}

export interface AnimatedBottomNavProps {
  items: AnimatedNavItem[];
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  accentColor?: string;
}

export default function AnimatedBottomNav({
  items,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
  accentColor,
}: AnimatedBottomNavProps) {
  const { theme } = useTheme();
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [itemWidths, setItemWidths] = useState<number[]>([]);
  const [textWidths, setTextWidths] = useState<number[]>([]);

  const activeIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : internalActiveIndex;
  const finalAccentColor = accentColor || theme.primary;

  const animatedValues = items.map(() => ({
    iconScale: new Animated.Value(1),
    iconTranslateY: new Animated.Value(0),
    textOpacity: new Animated.Value(0),
    lineWidth: new Animated.Value(0),
  }));

  useEffect(() => {
    items.forEach((_, index) => {
      const isActive = index === activeIndex;

      Animated.parallel([
        Animated.spring(animatedValues[index].iconScale, {
          toValue: isActive ? 1.1 : 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.sequence([
          Animated.timing(animatedValues[index].iconTranslateY, {
            toValue: isActive ? -4 : 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValues[index].iconTranslateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(animatedValues[index].textOpacity, {
          toValue: isActive ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[index].lineWidth, {
          toValue: isActive && textWidths[index] ? textWidths[index] : 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [activeIndex, textWidths]);

  const handleItemPress = (index: number) => {
    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(index);
    }
    onActiveIndexChange?.(index);
    items[index]?.onPress?.();
  };

  const handleTextLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTextWidths(prev => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  };

  const styles = createStyles(theme, finalAccentColor);

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={`${item.label}-${index}`}
            style={styles.item}
            onPress={() => handleItemPress(index)}
            activeOpacity={0.7}
          >
            <View style={styles.itemContent}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      { scale: animatedValues[index].iconScale },
                      { translateY: animatedValues[index].iconTranslateY },
                    ],
                  },
                ]}
              >
                <IconComponent
                  size={24}
                  color={isActive ? finalAccentColor : theme.textTertiary}
                />
              </Animated.View>

              <View style={styles.textContainer}>
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? finalAccentColor : theme.textTertiary,
                      opacity: animatedValues[index].textOpacity,
                    },
                  ]}
                  onLayout={handleTextLayout(index)}
                  numberOfLines={1}
                >
                  {item.label}
                </Animated.Text>

                <Animated.View
                  style={[
                    styles.underline,
                    {
                      backgroundColor: finalAccentColor,
                      width: animatedValues[index].lineWidth,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any, accentColor: string) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      height: Platform.OS === 'web' ? 90 : 85,
      paddingBottom: Platform.OS === 'web' ? 20 : 12,
      paddingTop: Platform.OS === 'web' ? 12 : 8,
      paddingHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: 4,
    },
    textContainer: {
      alignItems: 'center',
      minHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    underline: {
      height: 2,
      borderRadius: 1,
      marginTop: 2,
    },
  });
