import type { EditorState } from './editor-state'

export const EmptyEditorStateForKeysOnly: EditorState = {
  id: null,
  vscodeBridgeId: null as any,
  forkedFromProjectId: null,
  appID: null,
  projectName: null as any,
  projectDescription: 'Made with Utopia',
  projectVersion: null as any,
  isLoaded: false,
  trueUpGroupsForElementAfterDomWalkerRuns: [],
  spyMetadata: null as any,
  domMetadata: null as any,
  jsxMetadata: null as any,
  elementPathTree: {},
  projectContents: {},
  codeResultCache: null as any,
  propertyControlsInfo: null as any,
  nodeModules: {
    skipDeepFreeze: true,
    files: {},
    projectFilesBuildResults: {},
    packageStatus: {},
  },
  selectedViews: [],
  highlightedViews: [],
  hoveredViews: [],
  hiddenInstances: [],
  displayNoneInstances: [],
  warnedInstances: [],
  lockedElements: {
    simpleLock: [],
    hierarchyLock: [],
  },
  mode: null as any,
  focusedPanel: 'canvas',
  keysPressed: {},
  mouseButtonsPressed: null as any,
  openPopupId: null,
  toasts: [],
  cursorStack: {
    fixed: null,
    mouseOver: [],
  },
  leftMenu: {
    selectedTab: null as any,
    expanded: false,
    paneWidth: null as any,
  },
  rightMenu: {
    selectedTab: null as any,
    expanded: true,
  },
  interfaceDesigner: {
    codePaneWidth: 500,
    codePaneVisible: true,
    additionalControls: true,
  },
  canvas: {
    elementsToRerender: 'rerender-all-elements',
    interactionSession: null,
    scale: 1,
    snappingThreshold: null as any,
    realCanvasOffset: null as any,
    roundedCanvasOffset: null as any,
    textEditor: null,
    selectionControlsVisible: true,
    cursor: null,
    duplicationState: null,
    base64Blobs: {},
    mountCount: 0,
    canvasContentInvalidateCount: 0,
    domWalkerInvalidateCount: 0,
    openFile: {
      filename: null as any,
    },
    scrollAnimation: false,
    transientProperties: null,
    resizeOptions: {
      propertyTargetOptions: ['width', 'height'],
      propertyTargetSelectedIndex: 0,
    },
    domWalkerAdditionalElementsToUpdate: [],
    controls: {
      snappingGuidelines: [],
      outlineHighlights: [],
      strategyIntendedBounds: [],
      flexReparentTargetLines: [],
      parentHighlightPaths: null,
      reparentedToPaths: [],
      dragToMoveIndicatorFlags: null as any,
      parentOutlineHighlight: null,
    },
  },
  floatingInsertMenu: {
    insertMenuMode: 'closed',
  },
  inspector: {
    visible: true,
    classnameFocusCounter: 0,
  },
  dependencyList: {
    minimised: false,
  },
  genericExternalResources: {
    minimised: true,
  },
  googleFontsResources: {
    minimised: true,
  },
  projectSettings: {
    minimised: false,
  },
  fileBrowser: {
    minimised: false,
    dropTarget: null,
    renamingTarget: null,
  },
  navigator: {
    minimised: false,
    dropTargetHint: null,
    collapsedViews: [],
    renamingTarget: null,
    highlightedTargets: [],
    hiddenInNavigator: [],
  },
  topmenu: {
    formulaBarMode: 'content',
    formulaBarFocusCounter: 0,
  },
  preview: {
    visible: false,
    connected: false,
  },
  home: {
    visible: false,
  },
  lastUsedFont: null,
  modal: null,
  localProjectList: [],
  projectList: [],
  showcaseProjects: [],
  codeEditingEnabled: false,
  codeEditorErrors: {
    buildErrors: {},
    lintErrors: {},
  },
  thumbnailLastGenerated: 0,
  pasteTargetsToIgnore: [],
  parseOrPrintInFlight: false,
  safeMode: false,
  saveError: false,
  vscodeBridgeReady: false,
  vscodeReady: false,
  focusedElementPath: null,
  config: null as any,
  vscodeLoadingScreenVisible: true,
  indexedDBFailed: false,
  forceParseFiles: [],
  allElementProps: {},
  _currentAllElementProps_KILLME: {},
  githubSettings: null as any,
  imageDragSessionState: null as any,
  githubOperations: [],
  branchOriginContents: null,
  githubData: null as any,
  refreshingDependencies: false,
  colorSwatches: [],
  internalClipboard: {
    styleClipboard: [],
    elements: [],
  },
}
