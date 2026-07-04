import React from 'react'
import { Redirect } from 'expo-router'

export default function EventsListPage() {
  return <Redirect href={{ pathname: '/explore', params: { going: '1' } }} />
}
