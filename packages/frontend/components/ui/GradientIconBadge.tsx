import React from 'react'
import { IconBadge } from './IconBadge'

interface GradientIconBadgeProps {
  children: React.ReactNode
  size?: number
  colors?: [string, string]
}

export function GradientIconBadge({
  colors = ['#fb923c', '#c2410c'],
  ...rest
}: GradientIconBadgeProps) {
  return <IconBadge {...rest} gradient={colors} />
}
