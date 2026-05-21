"use client";

import nextDynamic from 'next/dynamic'
import config from '../../../../sanity.config'

const NextStudio = nextDynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { ssr: false }
)

export default function Studio() {
  return <NextStudio config={config} />
}
