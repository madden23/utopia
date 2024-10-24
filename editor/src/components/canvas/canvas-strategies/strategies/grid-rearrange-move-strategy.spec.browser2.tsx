import { MetadataUtils } from '../../../../core/model/element-metadata-utils'
import { isLeft } from '../../../../core/shared/either'
import * as EP from '../../../../core/shared/element-path'
import { isJSXElement } from '../../../../core/shared/element-template'
import {
  getRectCenter,
  localRectangle,
  offsetPoint,
  windowPoint,
} from '../../../../core/shared/math-utils'
import { selectComponentsForTest } from '../../../../utils/utils.test-utils'
import CanvasActions from '../../canvas-actions'
import { GridCellTestId } from '../../controls/grid-controls-for-strategies'
import { CanvasControlsContainerID } from '../../controls/new-canvas-controls'
import { mouseDragFromPointToPoint, mouseUpAtPoint } from '../../event-helpers.test-utils'
import type { EditorRenderResult } from '../../ui-jsx.test-utils'
import { renderTestEditorWithCode } from '../../ui-jsx.test-utils'
import type { GridCellCoordinates } from './grid-cell-bounds'
import { gridCellTargetId } from './grid-cell-bounds'

describe('grid rearrange move strategy', () => {
  it('can rearrange elements on a grid', async () => {
    const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

    const testId = 'aaa'
    const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
      scale: 1,
      pathString: `sb/scene/grid/${testId}`,
      testId: testId,
    })
    expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
      gridColumnEnd: '7',
      gridColumnStart: '3',
      gridRowEnd: '4',
      gridRowStart: '2',
    })
  })

  it('can not rearrange multicell element out of the grid', async () => {
    const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

    const testId = 'aaa'
    // moving a multi-cell element to the left, but it is already on the left of the grid
    const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
      scale: 1,
      pathString: `sb/scene/grid/${testId}`,
      testId: testId,
      targetCell: { row: 2, column: 1 },
      draggedCell: { row: 2, column: 2 },
    })
    expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
      gridColumnEnd: '5',
      gridColumnStart: '1',
      gridRowEnd: '3',
      gridRowStart: '1',
    })
  })

  it('can rearrange element with no explicit grid props set', async () => {
    const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

    const testId = 'bbb'
    const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
      scale: 1,
      pathString: `sb/scene/grid/${testId}`,
      testId: testId,
    })
    expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
      gridColumnEnd: 'auto',
      gridColumnStart: '3',
      gridRowEnd: 'auto',
      gridRowStart: '2',
    })
  })

  it('can rearrange elements on a grid (zoom out)', async () => {
    const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

    const testId = 'aaa'
    const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
      scale: 0.5,
      pathString: `sb/scene/grid/${testId}`,
      testId: testId,
    })
    expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
      gridColumnEnd: '7',
      gridColumnStart: '3',
      gridRowEnd: '4',
      gridRowStart: '2',
    })
  })

  it('can rearrange elements on a grid (zoom in)', async () => {
    const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

    const testId = 'aaa'
    const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
      scale: 2,
      pathString: `sb/scene/grid/${testId}`,
      testId: testId,
    })
    expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
      gridColumnEnd: '7',
      gridColumnStart: '3',
      gridRowEnd: '4',
      gridRowStart: '2',
    })
  })

  describe('grids within grids', () => {
    it('can move a grid child that is a grid itself', async () => {
      const editor = await renderTestEditorWithCode(
        `import * as React from 'react'
import { Storyboard } from 'utopia-api'

export var storyboard = (
  <Storyboard data-uid='sb'>
    <div
      data-uid='grid'
      data-testid='grid'
      style={{
        position: 'absolute',
        left: -94,
        top: 698,
        display: 'grid',
        gap: 10,
        width: 600,
        height: 'max-content',
        gridTemplateColumns: '2.4fr 1fr 1fr',
        gridTemplateRows: '99px 109px 90px',
      }}
    >
      <div
        data-uid='grid-inside-grid'
        data-testid='grid-inside-grid'
        style={{
          backgroundColor: 'green',
          contain: 'layout',
          display: 'grid',
          gap: 5,
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr',
          gridColumn: 1,
          gridRow: 2,
		  width: '100%',
		  height: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: '#aaaaaa33',
            width: 66,
            height: 67,
            contain: 'layout',
          }}
          data-uid='ad3e425d-a224-44a9-a303-465f80e0'
        />
        <div
          style={{
            backgroundColor: '#aaaaaa33',
            width: 66,
            height: 67,
            contain: 'layout',
          }}
          data-uid='d805fd1f-fdcd-422f-a785-f023409c'
        />
        <div
          style={{
            backgroundColor: '#aaaaaa33',
            width: 66,
            height: 67,
            contain: 'layout',
          }}
          data-uid='b2124463-bd84-414f-960b-29689a92'
        />
      </div>
    </div>
  </Storyboard>
)
`,
        'await-first-dom-report',
      )

      const testId = 'grid-inside-grid'
      const elementPathToDrag = EP.fromString(`sb/grid/${testId}`)

      await selectComponentsForTest(editor, [elementPathToDrag])

      const sourceGridCell = editor.renderedDOM.getByTestId(GridCellTestId(elementPathToDrag))
      const targetGridCell = editor.renderedDOM.getByTestId(
        gridCellTargetId(EP.fromString('sb/grid'), 2, 3),
      )

      const sourceRect = sourceGridCell.getBoundingClientRect()
      const targetRect = targetGridCell.getBoundingClientRect()

      await mouseDragFromPointToPoint(
        sourceGridCell,
        {
          x: sourceRect.x + 10,
          y: sourceRect.y + 10,
        },
        getRectCenter(
          localRectangle({
            x: targetRect.x,
            y: targetRect.y,
            width: targetRect.width,
            height: targetRect.height,
          }),
        ),
        {
          moveBeforeMouseDown: true,
        },
      )

      const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } =
        editor.renderedDOM.getByTestId(testId).style

      expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
        gridColumnEnd: 'auto',
        gridColumnStart: '3',
        gridRowEnd: 'auto',
        gridRowStart: '2',
      })
    })
  })

  describe('absolute move within grid', () => {
    describe('when the cell has positioning', () => {
      const ProjectCode = `import { Scene, Storyboard } from 'utopia-api'
export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 700,
        height: 759,
        position: 'absolute',
        left: 212,
        top: 128,
      }}
      data-label='Playground'
      data-uid='scene'
    >
      <div
        data-uid='grid'
        style={{
          backgroundColor: '#fefefe',
          position: 'absolute',
          left: 123,
          top: 133,
          width: 461,
          height: 448,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          border: '5px solid #000',
          gridGap: 10,
        }}
      >
        <div
          data-uid='child'
          data-testid='child'
          style={{
            backgroundColor: '#59a6ed',
            position: 'absolute',
            left: 12,
            top: 16,
            width: 144,
            height: 134,
            gridColumn: 1,
            gridRow: 1,
          }}
        />
      </div>
    </Scene>
  </Storyboard>
)
`
      it('can move absolute element inside a grid cell', async () => {
        const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

        const child = editor.renderedDOM.getByTestId('child')

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '12px',
            top: '16px',
          })
        }

        await selectComponentsForTest(editor, [EP.fromString('sb/scene/grid/child')])

        const childBounds = child.getBoundingClientRect()
        const childCenter = windowPoint({
          x: Math.floor(childBounds.left + childBounds.width / 2),
          y: Math.floor(childBounds.top + childBounds.height / 2),
        })

        await mouseDragFromPointToPoint(
          editor.renderedDOM.getByTestId(GridCellTestId(EP.fromString('sb/scene/grid/child'))),
          childCenter,
          offsetPoint(childCenter, windowPoint({ x: 20, y: 20 })),
          {
            moveBeforeMouseDown: true,
          },
        )

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '37px',
            top: '41px',
          })
        }
      })

      it('can move absolute element inside a grid cell, zoomed in', async () => {
        const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

        await editor.dispatch([CanvasActions.zoom(2)], true)

        const child = editor.renderedDOM.getByTestId('child')

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '12px',
            top: '16px',
          })
        }

        await selectComponentsForTest(editor, [EP.fromString('sb/scene/grid/child')])

        const childBounds = child.getBoundingClientRect()
        const childCenter = windowPoint({
          x: Math.floor(childBounds.left + childBounds.width / 2),
          y: Math.floor(childBounds.top + childBounds.height / 2),
        })

        await mouseDragFromPointToPoint(
          editor.renderedDOM.getByTestId(GridCellTestId(EP.fromString('sb/scene/grid/child'))),
          childCenter,
          offsetPoint(childCenter, windowPoint({ x: 240, y: 240 })),
          {
            moveBeforeMouseDown: true,
          },
        )

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '137px',
            top: '141px',
          })
        }
      })

      it('can move absolute element among grid cells', async () => {
        const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

        const child = editor.renderedDOM.getByTestId('child')

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '12px',
            top: '16px',
          })
        }

        await selectComponentsForTest(editor, [EP.fromString('sb/scene/grid/child')])

        const childBounds = child.getBoundingClientRect()
        const childCenter = windowPoint({
          x: Math.floor(childBounds.left + childBounds.width / 2),
          y: Math.floor(childBounds.top + childBounds.height / 2),
        })

        await mouseDragFromPointToPoint(
          editor.renderedDOM.getByTestId(GridCellTestId(EP.fromString('sb/scene/grid/child'))),
          childCenter,
          offsetPoint(childCenter, windowPoint({ x: 240, y: 240 })),
          {
            moveBeforeMouseDown: true,
          },
        )

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '2',
            gridRow: '2',
            left: '26.5px',
            top: '37px',
          })
        }
      })

      it("can move element spanning multiple cell by a cell that isn't the root cell", async () => {
        const editor = await renderTestEditorWithCode(
          `import { Scene, Storyboard } from 'utopia-api'
export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      data-uid='scene'
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 700,
        height: 759,
        position: 'absolute',
        left: 212,
        top: 128,
      }}
      data-label='Playground'
    >
      <div
        data-uid='grid'
        style={{
          backgroundColor: '#fefefe',
          position: 'absolute',
          left: 123,
          top: 133,
          width: 461,
          height: 448,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr 1fr',
          border: '5px solid #000',
          gridGap: 10,
        }}
      >
        <div
          data-uid='child'
          data-testid='child'
          style={{
            position: 'absolute',
            wordBreak: 'break-word',
            width: 127,
            height: 122,
            backgroundColor: '#ff2800',
            gridColumn: 2,
            gridRow: 2,
            top: 45,
            left: 41.25,
          }}
        />
      </div>
    </Scene>
  </Storyboard>
)
`,
          'await-first-dom-report',
        )

        await selectComponentsForTest(editor, [EP.fromString('sb/scene/grid/child')])

        const child = editor.renderedDOM.getByTestId('child')
        const childBounds = child.getBoundingClientRect()
        const startPoint = windowPoint({
          x: Math.floor(childBounds.left + childBounds.width - 3),
          y: Math.floor(childBounds.top + childBounds.height - 3),
        })

        await mouseDragFromPointToPoint(
          editor.renderedDOM.getByTestId(GridCellTestId(EP.fromString('sb/scene/grid/child'))),
          startPoint,
          offsetPoint(startPoint, windowPoint({ x: -100, y: -100 })),
          {
            moveBeforeMouseDown: true,
          },
        )

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '1',
            gridRow: '1',
            left: '61.5px',
            top: '62px',
          })
        }
      })
    })
    describe('when the cell has no positioning', () => {
      const ProjectCode = `import { Scene, Storyboard } from 'utopia-api'
export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 700,
        height: 759,
        position: 'absolute',
        left: 212,
        top: 128,
      }}
      data-label='Playground'
      data-uid='scene'
    >
      <div
        data-uid='grid'
        style={{
          backgroundColor: '#fefefe',
          position: 'absolute',
          left: 123,
          top: 133,
          width: 461,
          height: 448,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          border: '5px solid #000',
          gridGap: 10,
        }}
      >
        <div
          data-uid='child'
          data-testid='child'
          style={{
            backgroundColor: '#59a6ed',
            position: 'absolute',
            left: 12,
            top: 16,
            width: 144,
            height: 134,
          }}
        />
      </div>
    </Scene>
  </Storyboard>
)
`
      it('performs an absolute move relative to the grid', async () => {
        const editor = await renderTestEditorWithCode(ProjectCode, 'await-first-dom-report')

        const child = editor.renderedDOM.getByTestId('child')

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '',
            gridRow: '',
            left: '12px',
            top: '16px',
          })
        }

        await selectComponentsForTest(editor, [EP.fromString('sb/scene/grid/child')])

        const childBounds = child.getBoundingClientRect()
        const childCenter = windowPoint({
          x: Math.floor(childBounds.left + childBounds.width / 2),
          y: Math.floor(childBounds.top + childBounds.height / 2),
        })

        await mouseDragFromPointToPoint(
          editor.renderedDOM.getByTestId(GridCellTestId(EP.fromString('sb/scene/grid/child'))),
          childCenter,
          offsetPoint(childCenter, windowPoint({ x: 280, y: 120 })),
          {
            staggerMoveEvents: false,
            moveBeforeMouseDown: true,
          },
        )

        {
          const { top, left, gridColumn, gridRow } = child.style
          expect({ top, left, gridColumn, gridRow }).toEqual({
            gridColumn: '',
            gridRow: '',
            left: '297px',
            top: '141px',
          })
        }
      })
    })
  })

  describe('reorder', () => {
    it('reorders an element without setting positioning (inside contiguous area)', async () => {
      const editor = await renderTestEditorWithCode(ProjectCodeReorder, 'await-first-dom-report')
      const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd, cells } =
        await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 1, column: 3 })

      expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
        gridColumnEnd: '',
        gridColumnStart: '',
        gridRowEnd: '',
        gridRowStart: '',
      })

      expect(cells).toEqual(['pink', 'cyan', 'orange', 'blue'])
    })
    it('reorders an element without setting positioning (edge of contiguous area)', async () => {
      const editor = await renderTestEditorWithCode(ProjectCodeReorder, 'await-first-dom-report')

      const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd, cells } =
        await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 2, column: 1 })

      expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
        gridColumnEnd: '',
        gridColumnStart: '',
        gridRowEnd: '',
        gridRowStart: '',
      })

      expect(cells).toEqual(['pink', 'cyan', 'blue', 'orange'])
    })
    it('reorders an element setting positioning when outside of contiguous area', async () => {
      const editor = await renderTestEditorWithCode(ProjectCodeReorder, 'await-first-dom-report')

      const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd, cells } =
        await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 2, column: 2 })

      expect({ gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd }).toEqual({
        gridColumnEnd: 'auto',
        gridColumnStart: '2',
        gridRowEnd: 'auto',
        gridRowStart: '2',
      })

      expect(cells).toEqual(['pink', 'cyan', 'blue', 'orange'])
    })
    it('reorders an element setting positioning also relative to other fixed elements', async () => {
      const editor = await renderTestEditorWithCode(ProjectCodeReorder, 'await-first-dom-report')

      const first = await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 2, column: 2 })

      expect({
        gridRowStart: first.gridRowStart,
        gridRowEnd: first.gridRowEnd,
        gridColumnStart: first.gridColumnStart,
        gridColumnEnd: first.gridColumnEnd,
      }).toEqual({
        gridColumnEnd: 'auto',
        gridColumnStart: '2',
        gridRowEnd: 'auto',
        gridRowStart: '2',
      })

      expect(first.cells).toEqual(['pink', 'cyan', 'blue', 'orange'])

      const second = await runReorderTest(editor, 'sb/scene/grid', 'pink', { row: 2, column: 3 })

      expect({
        gridRowStart: second.gridRowStart,
        gridRowEnd: second.gridRowEnd,
        gridColumnStart: second.gridColumnStart,
        gridColumnEnd: second.gridColumnEnd,
      }).toEqual({
        gridColumnEnd: 'auto',
        gridColumnStart: '3',
        gridRowEnd: 'auto',
        gridRowStart: '2',
      })

      expect(second.cells).toEqual(['cyan', 'blue', 'orange', 'pink'])
    })

    it('reorders and removes positioning when moving back to contiguous', async () => {
      const editor = await renderTestEditorWithCode(ProjectCodeReorder, 'await-first-dom-report')

      const first = await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 2, column: 2 })
      expect({
        gridRowStart: first.gridRowStart,
        gridRowEnd: first.gridRowEnd,
        gridColumnStart: first.gridColumnStart,
        gridColumnEnd: first.gridColumnEnd,
      }).toEqual({
        gridColumnEnd: 'auto',
        gridColumnStart: '2',
        gridRowEnd: 'auto',
        gridRowStart: '2',
      })

      expect(first.cells).toEqual(['pink', 'cyan', 'blue', 'orange'])

      const second = await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 1, column: 1 })

      expect({
        gridRowStart: second.gridRowStart,
        gridRowEnd: second.gridRowEnd,
        gridColumnStart: second.gridColumnStart,
        gridColumnEnd: second.gridColumnEnd,
      }).toEqual({
        gridColumnEnd: '',
        gridColumnStart: '',
        gridRowEnd: '',
        gridRowStart: '',
      })

      expect(second.cells).toEqual(['orange', 'pink', 'cyan', 'blue'])
    })

    it('doesnt reorder when element occupies multiple cells', async () => {
      const editor = await renderTestEditorWithCode(
        ProjectCodeReorderwithMultiCellChild,
        'await-first-dom-report',
      )

      const result = await runReorderTest(editor, 'sb/scene/grid', 'orange', { row: 1, column: 1 })
      expect({
        gridRowStart: result.gridRowStart,
        gridRowEnd: result.gridRowEnd,
        gridColumnStart: result.gridColumnStart,
        gridColumnEnd: result.gridColumnEnd,
      }).toEqual({
        gridColumnEnd: '3',
        gridColumnStart: '1',
        gridRowEnd: 'auto',
        gridRowStart: '1',
      })

      expect(result.cells).toEqual(['pink', 'orange', 'cyan', 'blue'])
    })
  })
})

async function runMoveTest(
  editor: EditorRenderResult,
  props: {
    scale: number
    pathString: string
    testId: string
    targetCell?: GridCellCoordinates
    draggedCell?: GridCellCoordinates
  },
) {
  const elementPathToDrag = EP.fromString(props.pathString)

  await selectComponentsForTest(editor, [elementPathToDrag])

  if (props.scale !== 1) {
    await editor.dispatch([CanvasActions.zoom(props.scale)], true)
  }

  const sourceGridCell = editor.renderedDOM.getByTestId(
    props.draggedCell == null
      ? GridCellTestId(elementPathToDrag)
      : gridCellTargetId(
          EP.fromString('sb/scene/grid'),
          props.draggedCell.row,
          props.draggedCell.column,
        ),
  )
  const targetGridCell = editor.renderedDOM.getByTestId(
    gridCellTargetId(
      EP.fromString('sb/scene/grid'),
      props.targetCell?.row ?? 2,
      props.targetCell?.column ?? 3,
    ),
  )

  const sourceRect = sourceGridCell.getBoundingClientRect()
  const targetRect = targetGridCell.getBoundingClientRect()

  const endPoint = getRectCenter(
    localRectangle({
      x: targetRect.x,
      y: targetRect.y,
      width: targetRect.width,
      height: targetRect.height,
    }),
  )

  await mouseDragFromPointToPoint(
    sourceGridCell,
    {
      x: sourceRect.x + 10,
      y: sourceRect.y + 10,
    },
    endPoint,
    {
      staggerMoveEvents: false,
      moveBeforeMouseDown: true,
    },
  )
  await mouseUpAtPoint(editor.renderedDOM.getByTestId(CanvasControlsContainerID), endPoint)

  return editor.renderedDOM.getByTestId(props.testId).style
}

async function runReorderTest(
  editor: EditorRenderResult,
  gridTestId: string,
  testId: string,
  targetCell: GridCellCoordinates,
) {
  const { gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd } = await runMoveTest(editor, {
    scale: 1,
    pathString: `${gridTestId}/${testId}`,
    testId: testId,
    targetCell: targetCell,
  })

  const element = editor.getEditorState().editor.jsxMetadata[gridTestId]
  if (isLeft(element.element) || !isJSXElement(element.element.value)) {
    throw new Error('expected jsx element')
  }

  const cells = MetadataUtils.getChildrenOrdered(
    editor.getEditorState().editor.jsxMetadata,
    editor.getEditorState().editor.elementPathTree,
    element.elementPath,
  )

  return {
    gridRowStart: gridRowStart,
    gridRowEnd: gridRowEnd,
    gridColumnStart: gridColumnStart,
    gridColumnEnd: gridColumnEnd,
    cells: cells.map((c) => EP.toUid(c.elementPath)),
  }
}

const ProjectCode = `import * as React from 'react'
import { Scene, Storyboard, Placeholder } from 'utopia-api'

export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 847,
        height: 895,
        position: 'absolute',
        left: 46,
        top: 131,
      }}
      data-label='Playground'
      data-uid='scene'
    >
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '75px 75px 75px 75px',
          gridTemplateColumns:
            '50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px',
          gridGap: 16,
          height: 482,
          width: 786,
          position: 'absolute',
          left: 31,
          top: 0,
        }}
        data-uid='grid'
      >
        <div
          style={{
            minHeight: 0,
            backgroundColor: '#f3785f',
            gridColumnEnd: 5,
            gridColumnStart: 1,
            gridRowEnd: 3,
            gridRowStart: 1,
          }}
          data-uid='aaa'
          data-testid='aaa'
        />
        <div
          style={{
            minHeight: 0,
            backgroundColor: '#23565b',
          }}
          data-uid='bbb'
          data-testid='bbb'
        />
        <Placeholder
          style={{
            minHeight: 0,
            gridColumnEnd: 5,
            gridRowEnd: 4,
            gridColumnStart: 1,
            gridRowStart: 3,
            backgroundColor: '#0074ff',
          }}
          data-uid='ccc'
        />
        <Placeholder
          style={{
            minHeight: 0,
            gridColumnEnd: 9,
            gridRowEnd: 4,
            gridColumnStart: 5,
            gridRowStart: 3,
          }}
          data-uid='ddd'
        />
      </div>
    </Scene>
  </Storyboard>
)
`

const ProjectCodeReorder = `import * as React from 'react'
import { Scene, Storyboard } from 'utopia-api'

export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 600,
        height: 600,
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      data-label='Playground'
      data-uid='scene'
    >
      <div
        style={{
          backgroundColor: '#aaaaaa33',
          width: 500,
          height: 500,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          gridGap: 10,
          padding: 10,
        }}
        data-testid='grid'
        data-uid='grid'
      >
        <div
          style={{
            backgroundColor: '#f09',
            width: '100%',
            height: '100%',
          }}
          data-uid='pink'
		      data-testid='pink'
          data-label='pink'
        />
        <div
          style={{
            backgroundColor: '#f90',
            width: '100%',
            height: '100%',
          }}
          data-uid='orange'
		      data-testid='orange'
          data-label='orange'
        />
        <div
          style={{
            backgroundColor: '#0f9',
            width: '100%',
            height: '100%',
          }}
          data-uid='cyan'
		      data-testid='cyan'
          data-label='cyan'
        />
        <div
          style={{
            backgroundColor: '#09f',
            width: '100%',
            height: '100%',
          }}
          data-uid='blue'
		      data-testid='blue'
          data-label='blue'
        />
      </div>
    </Scene>
  </Storyboard>
)
`

const ProjectCodeReorderwithMultiCellChild = `import * as React from 'react'
import { Scene, Storyboard } from 'utopia-api'

export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      id='playground-scene'
      commentId='playground-scene'
      style={{
        width: 600,
        height: 600,
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      data-label='Playground'
      data-uid='scene'
    >
      <div
        style={{
          backgroundColor: '#aaaaaa33',
          width: 500,
          height: 500,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          gridGap: 10,
          padding: 10,
        }}
        data-testid='grid'
        data-uid='grid'
      >
        <div
          style={{
            backgroundColor: '#f09',
            width: '100%',
            height: '100%',
          }}
          data-uid='pink'
		  data-testid='pink'
          data-label='pink'
        />
        <div
          style={{
            backgroundColor: '#f90',
            width: '100%',
            height: '100%',
            gridColumnStart: 2,
            gridColumnEnd: 4,
          }}
          data-uid='orange'
		  data-testid='orange'
          data-label='orange'
        />
        <div
          style={{
            backgroundColor: '#0f9',
            width: '100%',
            height: '100%',
          }}
          data-uid='cyan'
		  data-testid='cyan'
          data-label='cyan'
        />
        <div
          style={{
            backgroundColor: '#09f',
            width: '100%',
            height: '100%',
          }}
          data-uid='blue'
		  data-testid='blue'
          data-label='blue'
        />
      </div>
    </Scene>
  </Storyboard>
)
`
