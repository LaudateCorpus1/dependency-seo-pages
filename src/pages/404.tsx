import React from 'react'

import { Text } from '@codesandbox/components'

import SEO from '../components/seo'

const NotFoundPage = () => {
  return (
    <>
      <div>
        <SEO title={`Not found - CodeSandbox`} pkg="Not found" />
        <Text block size={40} weight="400" as="h1">
          Not found
        </Text>
        <Text block weight="400" as="h2">
          No sandboxes were found.
        </Text>
      </div>
    </>
  )
}

export default NotFoundPage
