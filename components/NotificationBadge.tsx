// =============================================================
// NotificationBadge – numeric badge shown on the tab-bar icon
// =============================================================

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  count: number
  size?: number
}

export default function NotificationBadge({ count, size = 18 }: Props) {
  if (count <= 0) return null

  const label = count > 99 ? '99+' : String(count)
  const minW  = label.length > 2 ? size + 6 : size

  return (
    <View style={[styles.badge, { height: size, minWidth: minW, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.58 }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -6,
    backgroundColor: '#E74C3C',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
    zIndex:          10,
  },
  text: {
    color:      '#FFFFFF',
    fontWeight: '800',
    lineHeight: undefined,
  },
})
