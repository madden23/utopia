import { renderTestEditorWithCode } from '../../components/canvas/ui-jsx.test-utils'
import { setFocusedElement } from '../../components/editor/actions/action-creators'
import { printTree } from './element-path-tree'
import * as EP from './element-path'

const TestCode = `
import * as React from 'react'
import { Scene, Storyboard } from 'utopia-api'

export var Card = (props) => {
  return (
    <div
      style={{
        height: 100,
        width: 100,
        backgroundColor: 'white',
      }}
      data-uid='card-root'
    >
      <span data-uid='card-span'>Top of Card</span>
      {props.children}
    </div>
  )
}

export var App = (props) => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        contain: 'layout',
      }}
      data-uid='app-root'
    >
      <Card data-uid='card'>
        <span data-uid='card-child'>Child of Card</span>
      </Card>
      <React.Fragment data-uid='frag'>
        <div data-uid='frag-child'>Before Conditional</div>
        {
          // @utopia/uid=cond-1
          true ? (
            <div
              style={{
                backgroundColor: '#aaaaaa33',
                width: 300,
                height: 300,
              }}
              data-uid='cond-1-true'
            >
              <div
                style={{
                  backgroundColor: '#aaaaaa33',
                  width: 100,
                  height: 100,
                }}
                data-uid='cond-1-true-child'
              >
                Top
              </div>
              {
                // @utopia/uid=cond-2
                true ? (
                  <div
                    style={{
                      backgroundColor: '#aaaaaa33',
                      width: 100,
                      height: 100,
                    }}
                    data-uid='cond-2-child'
                  >
                    Bottom
                  </div>
                ) : null
              }
            </div>
          ) : null
        }
      </React.Fragment>
      {props.children}
    </div>
  )
}

export var storyboard = (
  <Storyboard data-uid='sb'>
    <Scene
      style={{
        width: 700,
        height: 759,
        position: 'absolute',
        left: 10,
        top: 10,
      }}
      data-uid='sc'
    >
      <App data-uid='app'>
        <span data-uid='app-child'>Child of App</span>
      </App>
    </Scene>
    {}
  </Storyboard>
)
`

describe('Building and ordering the element path tree for a real project', () => {
  it('Correctly orders for the test project', async () => {
    const renderResult = await renderTestEditorWithCode(TestCode, 'await-first-dom-report')

    await renderResult.dispatch([setFocusedElement(EP.fromString('sb/sc/app:app-root/card'))], true)
    await renderResult.getDispatchFollowUpActionsFinished()

    expect(printTree(renderResult.getEditorState().editor.elementPathTree)).toEqual(
      `sb
  sb/sc
    sb/sc/app
      sb/sc/app:app-root
        sb/sc/app:app-root/card
          sb/sc/app:app-root/card:card-root
            sb/sc/app:app-root/card:card-root/card-span
          sb/sc/app:app-root/card/card-child
        sb/sc/app:app-root/frag
          sb/sc/app:app-root/frag/frag-child
          sb/sc/app:app-root/frag/cond-1
            sb/sc/app:app-root/frag/cond-1/cond-1-true
              sb/sc/app:app-root/frag/cond-1/cond-1-true/cond-1-true-child
              sb/sc/app:app-root/frag/cond-1/cond-1-true/cond-2
                sb/sc/app:app-root/frag/cond-1/cond-1-true/cond-2/cond-2-child
      sb/sc/app/app-child
`,
    )
  })
})
