import { createModifiedProject } from '../../../sample-projects/sample-project-utils.test-utils'
import { selectComponentsForTest } from '../../../utils/utils.test-utils'
import {
  formatTestProjectCode,
  getPrintedUiJsCodeWithoutUIDs,
  renderTestEditorWithModel,
} from '../../canvas/ui-jsx.test-utils'
import { StoryboardFilePath } from '../../editor/store/editor-state'
import * as EP from '../../../core/shared/element-path'
import { mouseClickAtPoint, pressKey } from '../../canvas/event-helpers.test-utils'
import {
  componentPickerCloseButtonTestId,
  componentPickerFilterInputTestId,
  componentPickerOptionTestId,
  componentPickerTestIdForProp,
} from './component-picker'

describe('The navigator render prop picker', () => {
  const PreferredChildComponents = [
    {
      name: 'FlexRow',
      variants: [
        { label: '(empty)', code: '<div />' },
        {
          label: 'with three placeholders',
          code: '<div>three totally real placeholders</div>',
        },
        {
          label: 'Fully Loaded (limited time only!)',
          code: '<div>The Fully Loaded one</div>',
        },
        {
          label: 'With Auto-Sizing Content',
          code: '<div>Sizes automatically</div>',
        },
      ],
    },
    {
      name: 'FlexCol',
    },
    {
      name: 'Flex',
    },
  ]

  const TestProject = createModifiedProject({
    [StoryboardFilePath]: `
    import * as React from 'react'
    import { Storyboard } from 'utopia-api'

    const Card = (props) => {
      return (
        <div style={props.style}>
          {props.title}
          {props.children}
        </div>
      )
    }

    export var storyboard = (
      <Storyboard data-uid='sb'>
        <Card
          style={{
            backgroundColor: '#aaaaaa33',
            position: 'absolute',
            left: 945,
            top: 111,
            width: 139,
            height: 87,
          }}
          data-uid='card'
        />
      </Storyboard>
    )
    `,
    ['/utopia/components.utopia.js']: `
    const Components = {
      '/utopia/storyboard': {
        Card: {
          supportsChildren: true,
          properties: {
            title: {
              control: 'jsx',
              preferredChildComponents: ${JSON.stringify(PreferredChildComponents)},
            },
          },
          variants: [],
        },
      },
    }
    
    export default Components    
    `,
  })

  it('Should be displayed with the correct prop when clicking a render prop slot in the navigator', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    const renderPropPicker = editor.renderedDOM.queryByTestId(componentPickerTestIdForProp('title'))
    expect(renderPropPicker).not.toBeNull()

    const propField = editor.renderedDOM.queryByTestId(
      `${componentPickerTestIdForProp('title')}-prop-field`,
    )
    expect(propField).not.toBeNull()
    expect(propField!.textContent).toEqual('Title')
  })

  it('Should include all registered preferred children for that prop', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    for (const childComponent of PreferredChildComponents) {
      const renderedOptionLabel = editor.renderedDOM.queryByTestId(
        componentPickerOptionTestId(childComponent.name),
      )
      expect(renderedOptionLabel).not.toBeNull()

      if (childComponent.variants != null) {
        for (const variant of childComponent.variants) {
          const renderedOptionVariant = editor.renderedDOM.queryByTestId(
            componentPickerOptionTestId(childComponent.name, variant.label),
          )
          expect(renderedOptionVariant).not.toBeNull()
        }
      }
    }
  })

  it('Filters the available options', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    // Select the search bar
    const filterInput = editor.renderedDOM.getByTestId(componentPickerFilterInputTestId)
    filterInput.focus()
    document.execCommand('insertText', false, 'flexr')
    // await pressKey('Enter', { targetElement: filterInput })

    // Check that it was filtered correctly
    for (const childComponent of PreferredChildComponents) {
      const renderedOptionLabel = editor.renderedDOM.queryByTestId(
        componentPickerOptionTestId(childComponent.name),
      )

      if (childComponent.name === 'FlexRow') {
        expect(renderedOptionLabel).not.toBeNull()
      } else {
        expect(renderedOptionLabel).toBeNull()
      }

      if (childComponent.variants != null) {
        for (const variant of childComponent.variants) {
          const renderedOptionVariant = editor.renderedDOM.queryByTestId(
            componentPickerOptionTestId(childComponent.name, variant.label),
          )

          if (childComponent.name === 'FlexRow') {
            expect(renderedOptionVariant).not.toBeNull()
          } else {
            expect(renderedOptionVariant).toBeNull()
          }
        }
      }
    }
  })

  it('Clears the filter when hitting esc', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    // Select the search bar
    const filterInput = editor.renderedDOM.getByTestId(componentPickerFilterInputTestId)
    filterInput.focus()
    document.execCommand('insertText', false, 'flexr')

    await pressKey('Escape', { targetElement: filterInput })

    for (const childComponent of PreferredChildComponents) {
      const renderedOptionLabel = editor.renderedDOM.queryByTestId(
        componentPickerOptionTestId(childComponent.name),
      )

      expect(renderedOptionLabel).not.toBeNull()

      if (childComponent.variants != null) {
        for (const variant of childComponent.variants) {
          const renderedOptionVariant = editor.renderedDOM.queryByTestId(
            componentPickerOptionTestId(childComponent.name, variant.label),
          )

          expect(renderedOptionVariant).not.toBeNull()
        }
      }
    }
  })

  it('Closes when clicking the X', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    const renderPropPickerBefore = editor.renderedDOM.queryByTestId(
      componentPickerTestIdForProp('title'),
    )
    expect(renderPropPickerBefore).not.toBeNull()

    const xButton = editor.renderedDOM.getByTestId(componentPickerCloseButtonTestId)
    await mouseClickAtPoint(xButton, { x: 2, y: 2 })

    const renderPropPickerAfter = editor.renderedDOM.queryByTestId(
      componentPickerTestIdForProp('title'),
    )
    expect(renderPropPickerAfter).toBeNull()
  })

  it('Does not close when clicking the empty space within the popup', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    const renderPropPickerBefore = editor.renderedDOM.queryByTestId(
      componentPickerTestIdForProp('title'),
    )
    expect(renderPropPickerBefore).not.toBeNull()

    await mouseClickAtPoint(renderPropPickerBefore!, { x: 2, y: 2 })

    const renderPropPickerAfter = editor.renderedDOM.queryByTestId(
      componentPickerTestIdForProp('title'),
    )
    expect(renderPropPickerAfter).not.toBeNull()
  })

  it('Selecting a component should insert that component into the render prop', async () => {
    const editor = await renderTestEditorWithModel(TestProject, 'await-first-dom-report')
    await selectComponentsForTest(editor, [EP.fromString('sb/card')])
    const emptySlot = editor.renderedDOM.getByTestId(
      'NavigatorItemTestId-slot_sb/card/prop_label_title',
    )
    await mouseClickAtPoint(emptySlot, { x: 2, y: 2 })

    const optionLabel = 'FlexRow'
    const optionVariantName = 'with three placeholders'
    const renderedOptionVariant = editor.renderedDOM.getByTestId(
      componentPickerOptionTestId(optionLabel, optionVariantName),
    )
    await mouseClickAtPoint(renderedOptionVariant, { x: 2, y: 2 })
    await editor.getDispatchFollowUpActionsFinished()

    expect(getPrintedUiJsCodeWithoutUIDs(editor.getEditorState(), StoryboardFilePath)).toEqual(
      formatTestProjectCode(`
    import * as React from 'react'
    import { Storyboard } from 'utopia-api'

    const Card = (props) => {
      return (
        <div style={props.style}>
          {props.title}
          {props.children}
        </div>
      )
    }

    export var storyboard = (
      <Storyboard>
        <Card
          style={{
            backgroundColor: '#aaaaaa33',
            position: 'absolute',
            left: 945,
            top: 111,
            width: 139,
            height: 87,
          }}
          title={
            <div style={{ width: 100, height: 100 }}>
              three totally real placeholders
            </div>
          }
        />
      </Storyboard>
    )
    `),
    )
  })
})
