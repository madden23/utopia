import React from 'react'
import { FlexRow, InspectorSectionIcons, InspectorSubsectionHeader } from '../../uuiui'
import { FillHugFixedControl } from './fill-hug-fixed-control'
import { ResizeToFitControl } from './resize-to-fit-control'

interface SizingSectionProps {}

export const SizingSection = React.memo<SizingSectionProps>(() => {
  return (
    <>
      <InspectorSubsectionHeader>
        <FlexRow
          style={{
            flexGrow: 1,
            gap: 8,
          }}
        >
          <InspectorSectionIcons.Layer />
          <span>Size</span>
        </FlexRow>
      </InspectorSubsectionHeader>
      <FlexRow style={{ padding: 4, justifyContent: 'flex-end' }}>
        <ResizeToFitControl />
      </FlexRow>
      <FillHugFixedControl />
    </>
  )
})