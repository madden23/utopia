import createCachedSelector from 're-reselect'
import type { CSSProperties } from 'react'
import React from 'react'
import { safeIndex } from '../../core/shared/array-utils'
import { FlexRow, Icn, Tooltip } from '../../uuiui'
import { convertGroupToFrameCommands } from '../canvas/canvas-strategies/strategies/group-conversion-helpers'
import { treatElementAsGroupLike } from '../canvas/canvas-strategies/strategies/group-helpers'
import { applyCommandsAction } from '../editor/actions/action-creators'
import { useDispatch } from '../editor/store/dispatch-context'
import { Substores, useEditorState, useRefEditorState } from '../editor/store/store-hook'
import type { MetadataSubstate } from '../editor/store/store-hook-substore-types'
import { metadataSelector, selectedViewsSelector } from './inpector-selectors'
import type { FixedHugFillMode } from './inspector-common'
import {
  detectFillHugFixedState,
  getFixedFillHugOptionsForElement,
  resizeToFillCommands,
  resizeToFitCommands,
  sizeToVisualDimensions,
} from './inspector-common'

export const ResizeToFitControlTestId = 'ResizeToFitControlTestId'
export const ResizeToFillControlTestId = 'ResizeToFillControlTestId'
export const ResizeToFixedControlTestId = 'ResizeToFixedControlTestId'

const isApplicableSelector = createCachedSelector(
  metadataSelector,
  (state) => state.editor.elementPathTree,
  selectedViewsSelector,
  (_: MetadataSubstate, mode: FixedHugFillMode) => mode,
  (metadata, pathTrees, selectedViews, mode) => {
    const firstSelectedView = safeIndex(selectedViews, 0)
    if (firstSelectedView == null || selectedViews.length < 1) {
      return false
    }

    const isApplicable: boolean =
      selectedViews.length > 0 &&
      !treatElementAsGroupLike(metadata, firstSelectedView) &&
      getFixedFillHugOptionsForElement(metadata, pathTrees, firstSelectedView).has(mode)
    const isAlreadyApplied =
      detectFillHugFixedState('horizontal', metadata, firstSelectedView).fixedHugFill?.type ===
        mode &&
      detectFillHugFixedState('vertical', metadata, firstSelectedView).fixedHugFill?.type === mode
    return isApplicable && !isAlreadyApplied
  },
)((_, mode) => mode)

interface ResizeToFitControlProps {}

export const ResizeToFitControl = React.memo<ResizeToFitControlProps>(() => {
  const dispatch = useDispatch()
  const selectedViewsRef = useRefEditorState((store) => store.editor.selectedViews)
  const elementPathTreeRef = useRefEditorState((store) => store.editor.elementPathTree)
  const allElementPropsRef = useRefEditorState((store) => store.editor.allElementProps)
  const metadataRef = useRefEditorState((store) => store.editor.jsxMetadata)

  const isHugApplicable = useEditorState(
    Substores.metadata,
    (store) => isApplicableSelector(store, 'hug'),
    'ResizeToFitControl isHugApplicable',
  )

  const isFillApplicable = useEditorState(
    Substores.metadata,
    (store) => isApplicableSelector(store, 'fill'),
    'ResizeToFitControl isHugApplicable',
  )

  const onResizeToFit = React.useCallback(() => {
    const commands = resizeToFitCommands(
      metadataRef.current,
      selectedViewsRef.current,
      elementPathTreeRef.current,
      allElementPropsRef.current,
    )
    if (commands.length > 0) {
      dispatch([applyCommandsAction(commands)])
    }
  }, [allElementPropsRef, dispatch, metadataRef, elementPathTreeRef, selectedViewsRef])

  const onResizeToFill = React.useCallback(() => {
    const commands = resizeToFillCommands(
      metadataRef.current,
      selectedViewsRef.current,
      elementPathTreeRef.current,
      allElementPropsRef.current,
    )
    if (commands.length > 0) {
      dispatch([applyCommandsAction(commands)])
    }
  }, [allElementPropsRef, dispatch, metadataRef, elementPathTreeRef, selectedViewsRef])

  const onSetToFixedSize = React.useCallback(() => {
    const commands = selectedViewsRef.current.flatMap((selectedView) => {
      const isGroup = treatElementAsGroupLike(metadataRef.current, selectedView)
      if (isGroup) {
        return convertGroupToFrameCommands(
          metadataRef.current,
          elementPathTreeRef.current,
          allElementPropsRef.current,
          selectedView,
        )
      } else {
        return sizeToVisualDimensions(metadataRef.current, selectedView)
      }
    })
    if (commands.length > 0) {
      dispatch([applyCommandsAction(commands)])
    }
  }, [dispatch, metadataRef, elementPathTreeRef, allElementPropsRef, selectedViewsRef])

  const disabledStyles = (enabled: boolean): CSSProperties =>
    enabled
      ? { cursor: 'pointer' }
      : {
          cursor: 'pointer',
          opacity: 0.5,
          pointerEvents: 'none',
        }

  return (
    <FlexRow style={{ gap: 12 }}>
      <Tooltip title={'Resize to Fit'}>
        <div
          data-testid={ResizeToFitControlTestId}
          onClick={onResizeToFit}
          style={{ cursor: 'pointer', ...disabledStyles(isHugApplicable) }}
        >
          <Icn
            type='fitToChildren'
            color='main'
            category='layout/commands'
            width={16}
            height={16}
          />
        </div>
      </Tooltip>
      <Tooltip title={'Resize to Fill'}>
        <div
          data-testid={ResizeToFillControlTestId}
          onClick={onResizeToFill}
          style={{ cursor: 'pointer', ...disabledStyles(isFillApplicable) }}
        >
          <Icn type='growToParent' color='main' category='layout/commands' width={16} height={16} />
        </div>
      </Tooltip>
      <Tooltip title={'Fixed size'}>
        <div
          data-testid={ResizeToFixedControlTestId}
          onClick={onSetToFixedSize}
          style={{ cursor: 'pointer' }}
        >
          <Icn type='fixed' color='main' category='layout/commands' width={16} height={16} />
        </div>
      </Tooltip>
    </FlexRow>
  )
})
