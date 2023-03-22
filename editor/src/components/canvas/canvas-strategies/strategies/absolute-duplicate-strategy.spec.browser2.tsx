import {
  EditorRenderResult,
  formatTestProjectCode,
  getPrintedUiJsCode,
  getPrintedUiJsCodeWithoutUIDs,
  makeTestProjectCodeWithSnippet,
  renderTestEditorWithCode,
  TestScenePath,
} from '../../ui-jsx.test-utils'
import { CanvasControlsContainerID } from '../../controls/new-canvas-controls'
import { FOR_TESTS_setNextGeneratedUid } from '../../../../core/model/element-template-utils.test-utils'
import { offsetPoint, windowPoint, WindowPoint } from '../../../../core/shared/math-utils'
import { altModifier, cmdModifier, Modifiers } from '../../../../utils/modifiers'
import { mouseClickAtPoint, mouseDragFromPointToPoint } from '../../event-helpers.test-utils'
import {
  expectElementWithTestIdNotToBeRendered,
  selectComponentsForTest,
  setFeatureForBrowserTests,
} from '../../../../utils/utils.test-utils'
import * as EP from '../../../../core/shared/element-path'
import { ImmediateParentOutlinesTestId } from '../../controls/parent-outlines'
import { ImmediateParentBoundsTestId } from '../../controls/parent-bounds'
import { NO_OP } from '../../../../core/shared/utils'
import { AllContentAffectingTypes } from './group-like-helpers'
import {
  getClosingGroupLikeTag,
  getOpeningGroupLikeTag,
  GroupLikeElementUid,
} from './group-like-helpers.test-utils'

async function dragElement(
  renderResult: EditorRenderResult,
  targetTestId: string,
  dragDelta: WindowPoint,
  modifiers: Modifiers,
  midDragCallback: () => void = NO_OP,
): Promise<void> {
  const targetElement = renderResult.renderedDOM.getByTestId(targetTestId)
  const targetElementBounds = targetElement.getBoundingClientRect()
  const canvasControlsLayer = renderResult.renderedDOM.getByTestId(CanvasControlsContainerID)

  const startPoint = windowPoint({ x: targetElementBounds.x + 5, y: targetElementBounds.y + 5 })
  const endPoint = offsetPoint(startPoint, dragDelta)

  await mouseClickAtPoint(canvasControlsLayer, startPoint, { modifiers: cmdModifier })
  await mouseDragFromPointToPoint(canvasControlsLayer, startPoint, endPoint, {
    modifiers: modifiers,
    midDragCallback: async () => midDragCallback(),
  })
}

describe('Absolute Duplicate Strategy', () => {
  it('duplicates the selected absolute element when pressing alt', async () => {
    const renderResult = await renderTestEditorWithCode(
      makeTestProjectCodeWithSnippet(`
        <div style={{ width: '100%', height: '100%', position: 'relative' }} data-uid='aaa'>
          <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 40, top: 50, width: 200, height: 120 }}
            data-uid='bbb'
            data-testid='bbb'
          />
        </div>
      `),
      'await-first-dom-report',
    )

    expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentOutlinesTestId([]))
    expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentBoundsTestId([]))

    const target = EP.appendNewElementPath(TestScenePath, ['container', 'aaa', 'bbb'])

    FOR_TESTS_setNextGeneratedUid('hello')
    const dragDelta = windowPoint({ x: 40, y: -25 })
    await dragElement(renderResult, 'bbb', dragDelta, altModifier, () => {
      expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentOutlinesTestId([target]))
      expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentBoundsTestId([target]))
    })

    await renderResult.getDispatchFollowUpActionsFinished()

    expect(getPrintedUiJsCode(renderResult.getEditorState())).toEqual(
      makeTestProjectCodeWithSnippet(`
        <div style={{ width: '100%', height: '100%', position: 'relative' }} data-uid='aaa'>
          <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 40, top: 50, width: 200, height: 120 }}
            data-uid='hello'
            data-testid='bbb'
            />
            <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 80, top: 25, width: 200, height: 120 }}
            data-uid='bbb'
            data-testid='bbb'
          />
        </div>
      `),
    )
  })

  it('duplicates the selected absolute element when pressing alt, even if the parent is static', async () => {
    const renderResult = await renderTestEditorWithCode(
      makeTestProjectCodeWithSnippet(`
        <div style={{ width: '100%', height: '100%' }} data-uid='aaa'>
          <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 40, top: 50, width: 200, height: 120 }}
            data-uid='bbb'
            data-testid='bbb'
          />
        </div>
      `),
      'await-first-dom-report',
    )

    FOR_TESTS_setNextGeneratedUid('hello')
    const dragDelta = windowPoint({ x: 40, y: -25 })
    await dragElement(renderResult, 'bbb', dragDelta, altModifier)

    await renderResult.getDispatchFollowUpActionsFinished()

    expect(getPrintedUiJsCode(renderResult.getEditorState())).toEqual(
      makeTestProjectCodeWithSnippet(`
        <div style={{ width: '100%', height: '100%' }} data-uid='aaa'>
          <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 40, top: 50, width: 200, height: 120 }}
            data-uid='hello'
            data-testid='bbb'
          />
          <div
            style={{ backgroundColor: '#aaaaaa33', position: 'absolute', left: 80, top: 25, width: 200, height: 120 }}
            data-uid='bbb'
            data-testid='bbb'
          />
        </div>
      `),
    )
  })

  describe('with content-affecting elements', () => {
    AllContentAffectingTypes.forEach((type) => {
      it(`duplicates the selected absolute element when pressing alt, even if it is a ${type}`, async () => {
        const renderResult = await renderTestEditorWithCode(
          formatTestProjectCode(
            projectWithFragment(
              `${getOpeningGroupLikeTag(type, { stripTestId: true })}
        <div
          style={{
            backgroundColor: '#d089cc',
            width: 150,
            height: 186,
            contain: 'layout',
            left: 7,
            top: 186,
            position: 'absolute',
          }}
          data-uid='chi'
          data-testid='child'
        >
          second
        </div>
        ${getClosingGroupLikeTag(type)}`,
            ),
          ),
          'await-first-dom-report',
        )

        const dragDelta = windowPoint({ x: 40, y: -25 })

        const targetElement = renderResult.renderedDOM.getByTestId('child')
        const targetElementBounds = targetElement.getBoundingClientRect()
        const canvasControlsLayer = renderResult.renderedDOM.getByTestId(CanvasControlsContainerID)

        const startPoint = windowPoint({
          x: targetElementBounds.x + 5,
          y: targetElementBounds.y + 5,
        })
        const endPoint = offsetPoint(startPoint, dragDelta)
        const target = EP.fromString(`sb/${GroupLikeElementUid}`)

        expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentOutlinesTestId([]))
        expectElementWithTestIdNotToBeRendered(renderResult, ImmediateParentBoundsTestId([]))

        await selectComponentsForTest(renderResult, [target])

        await mouseDragFromPointToPoint(canvasControlsLayer, startPoint, endPoint, {
          modifiers: altModifier,
          midDragCallback: async () => {
            expectElementWithTestIdNotToBeRendered(
              renderResult,
              ImmediateParentOutlinesTestId([target]),
            )
            expectElementWithTestIdNotToBeRendered(
              renderResult,
              ImmediateParentBoundsTestId([target]),
            )
          },
        })

        await renderResult.getDispatchFollowUpActionsFinished()

        expect(getPrintedUiJsCodeWithoutUIDs(renderResult.getEditorState())).toEqual(
          formatTestProjectCode(
            projectWithFragment(`
              ${getOpeningGroupLikeTag(type, { stripTestId: true, stripUids: true })}
        <div
          style={{
            backgroundColor: '#d089cc',
            width: 150,
            height: 186,
            contain: 'layout',
            left: 7,
            top: 186,
            position: 'absolute',
          }}
          data-testid='child'
        >
          second
        </div>
        ${getClosingGroupLikeTag(type)}
        ${getOpeningGroupLikeTag(type, { stripTestId: true, stripUids: true })}
        <div
          style={{
            backgroundColor: '#d089cc',
            width: 150,
            height: 186,
            contain: 'layout',
            left: 47,
            top: 161,
            position: 'absolute',
          }}
          data-testid='child'
        >
          second
        </div>
        ${getClosingGroupLikeTag(type)}`),
          ),
        )
      })
    })
  })
})

const projectWithFragment = (innards: string) => `import * as React from 'react'
import { Storyboard } from 'utopia-api'

export var storyboard = (
  <Storyboard>
    ${innards}
  </Storyboard>
)

`
