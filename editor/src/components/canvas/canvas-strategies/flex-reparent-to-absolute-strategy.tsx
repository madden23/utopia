import { BuiltInDependencies } from '../../../core/es-modules/package-manager/built-in-dependencies-list'
import { MetadataUtils } from '../../../core/model/element-metadata-utils'
import { canvasPoint, offsetPoint, rectContainsPoint } from '../../../core/shared/math-utils'
import { EditorState, EditorStatePatch } from '../../editor/store/editor-state'
import { foldAndApplyCommandsInner, WhenToRun } from '../commands/commands'
import { updateFunctionCommand } from '../commands/update-function-command'
import { ParentBounds } from '../controls/parent-bounds'
import { ParentOutlines } from '../controls/parent-outlines'
import { DragOutlineControl } from '../controls/select-mode/drag-outline-control'
import { absoluteReparentStrategy } from './absolute-reparent-strategy'
import { pickCanvasStateFromEditorState } from './canvas-strategies'
import {
  CanvasStrategy,
  emptyStrategyApplicationResult,
  getTargetPathsFromInteractionTarget,
  InteractionCanvasState,
  StrategyApplicationResult,
} from './canvas-strategy-types'
import { getEscapeHatchCommands } from './escape-hatch-strategy'
import { InteractionSession, StrategyState } from './interaction-state'
import { ifAllowedToReparent } from './reparent-helpers'
import { findReparentStrategy } from './reparent-strategy-helpers'
import { getDragTargets } from './shared-absolute-move-strategy-helpers'

export const flexReparentToAbsoluteStrategy: CanvasStrategy = {
  id: 'FLEX_REPARENT_TO_ABSOLUTE',
  name: 'Flex Reparent to Absolute',
  isApplicable: (canvasState, _interactionState, metadata) => {
    const selectedElements = getTargetPathsFromInteractionTarget(canvasState.interactionTarget)
    if (selectedElements.length == 1) {
      return MetadataUtils.isParentYogaLayoutedContainerAndElementParticipatesInLayout(
        selectedElements[0],
        metadata,
      )
    } else {
      return false
    }
  },
  controlsToRender: [
    {
      control: DragOutlineControl,
      key: 'ghost-outline-control',
      show: 'visible-only-while-active',
    },
    {
      control: ParentOutlines,
      key: 'parent-outlines-control',
      show: 'visible-only-while-active',
    },
    {
      control: ParentBounds,
      key: 'parent-bounds-control',
      show: 'visible-only-while-active',
    },
  ],
  fitness: (canvasState, interactionState, strategyState) => {
    // All 4 reparent strategies use the same fitness function findReparentStrategy
    const reparentStrategy = findReparentStrategy(
      canvasState,
      interactionState,
      strategyState,
    ).strategy
    if (reparentStrategy === 'FLEX_REPARENT_TO_ABSOLUTE') {
      return 3
    }
    return 0
  },
  apply: (canvasState, interactionState, strategyState) => {
    const selectedElements = getTargetPathsFromInteractionTarget(canvasState.interactionTarget)
    const filteredSelectedElements = getDragTargets(selectedElements)
    return ifAllowedToReparent(canvasState, strategyState, filteredSelectedElements, () => {
      if (
        interactionState.interactionData.type !== 'DRAG' ||
        interactionState.interactionData.drag == null
      ) {
        return emptyStrategyApplicationResult
      }

      const escapeHatchCommands = getEscapeHatchCommands(
        filteredSelectedElements,
        strategyState.startingMetadata,
        canvasState,
        canvasPoint({ x: 0, y: 0 }),
      ).commands

      return {
        commands: [
          ...escapeHatchCommands,
          updateFunctionCommand('always', (editorState, transient): Array<EditorStatePatch> => {
            return runAbsoluteReparentStrategyForFreshlyConvertedElement(
              canvasState.builtInDependencies,
              editorState,
              strategyState,
              interactionState,
              transient,
            )
          }),
        ],
        customState: null,
      }
    })
  },
}

function runAbsoluteReparentStrategyForFreshlyConvertedElement(
  builtInDependencies: BuiltInDependencies,
  editorState: EditorState,
  strategyState: StrategyState,
  interactionState: InteractionSession,
  commandLifecycle: 'mid-interaction' | 'end-interaction',
): Array<EditorStatePatch> {
  const canvasState = pickCanvasStateFromEditorState(editorState, builtInDependencies)

  const reparentCommands = absoluteReparentStrategy.apply(
    canvasState,
    interactionState,
    strategyState,
  ).commands

  return foldAndApplyCommandsInner(editorState, [], [], reparentCommands, commandLifecycle)
    .statePatches
}
