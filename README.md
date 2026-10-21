# CallCanvas

**A visual, drag-and-drop designer for voice-bot and IVR call flows.**

CallCanvas lets you sketch how a phone or voice bot conversation should go: what the bot says,
where the caller can branch (Positive / Negative / Intent), and how the bot handles the tricky
states: the caller asking it to wait, the bot failing to understand, an off-topic reply, or a
hang-up. Everything runs in the browser. There is no backend and no sign-up, and your flow is
saved automatically.

Built with [React 18](https://react.dev), [React Flow (@xyflow/react)](https://reactflow.dev)
and [Vite](https://vitejs.dev).

---

## Features

- **Drag-and-drop canvas**: drop nodes from the palette, connect them, pan and zoom.
- **Generic (bot utterance) nodes**: hold what the bot says. Double-click to edit them inline.
- **State nodes**: model the special situations of a call:

  | State | Meaning              | Notes                     |
  | ----- | -------------------- | ------------------------- |
  | WFM   | Wait For Me          | Can have a description    |
  | FTU   | Fail To Understand   | Can have a description    |
  | OOC   | Out Of Context       | Can have a description    |
  | HUP   | Hangup               | Ends the call             |

- **Typed, colour-coded edges**: Positive, Negative, FTU and Intent. Click a label to rename it.
- **Attach states to a Generic node**: they move together and are shown with a dashed link.
- **Descriptions panel**: one collapsible list of the descriptions on every WFM / FTU / OOC node.
  Click one to jump to its node on the canvas.
- **Autosave**: the flow is stored in your browser's `localStorage` and is still there after a reload.
- **Import / Export JSON**: share flows with teammates or keep them under version control.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- npm, which comes with Node.js

### Install and run

```bash
git clone https://github.com/saksheesachan003/call-canvas.git
cd call-canvas
npm install
npm run dev
```

The app opens at **http://localhost:3000**.

### Other scripts

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload (same as `npm start`) |
| `npm run build`   | Build a production bundle into `dist/`               |
| `npm run preview` | Serve the production build locally to check it       |

The build output in `dist/` is a static site. You can host it on GitHub Pages, Netlify, Vercel
or any static file server.

---

## How to use

The screen has three areas:

- **Left**: the node palette (Generic, WFM, FTU, OOC, HUP) and a short "How to use" guide.
- **Centre**: the canvas, where you build the flow.
- **Right**: the Descriptions panel, which you can collapse.

### 1. Add nodes
- Drag a node from the palette onto the canvas, **or** click it in the palette and then click the canvas.
- Drag from a Generic node's handle to empty space to create a new Generic node that is already connected.

### 2. Connect them
- A Generic node's **bottom handles** create, from left to right, **Positive**, **Negative** and **FTU** edges.
- Its **right handle** creates an **Intent** edge.
- Click an edge label to rename it.

### 3. Attach states
- Drag from a Generic node's handle onto a state node, **or** hover over the Generic node, click the
  🔗 link icon, then click the state nodes you want to attach.
- To detach one, use the state node's hover menu, or select the dashed link and press `Delete`.

### 4. Edit and describe
- Double-click a Generic node to edit its text. `Enter` saves and `Shift + Enter` adds a new line.
- Hover over a WFM / FTU / OOC node and click **+** to add a description.

### 5. Save and share
- The flow is **autosaved** in this browser.
- **Export** downloads the flow as `callcanvas-flow-YYYY-MM-DD.json`.
- **Import** loads a flow from a JSON file and replaces the current one.
- **Fit** zooms so the whole flow is on screen. **Clear** empties the canvas.

### Keyboard shortcuts

| Shortcut            | Action                                                       |
| ------------------- | ------------------------------------------------------------ |
| `Delete` / `Backspace` | Remove the selection (deleting a Generic node also removes its attached states) |
| `Esc`               | Cancel placing or attaching                                  |
| `Ctrl + Scroll`     | Zoom                                                         |
| `Shift + Drag`      | Box-select                                                   |

> **Note:** autosave lives only in the browser you are using. Clearing site data, or opening the app
> in another browser, starts you with an empty canvas. Use **Export** to keep a copy of
> anything important.

---

## Flow file format

Exported files are plain JSON:

```json
{
  "version": 1,
  "nodes":  [ /* React Flow nodes */ ],
  "edges":  [ /* React Flow edges */ ],
  "groups": [ /* Generic node → attached state nodes */ ]
}
```

A file must contain `nodes` and `edges` arrays to be imported.

---

## Project structure

```
call-canvas/
├── index.html
├── vite.config.js                 dev server on port 3000
├── package.json
└── src/
    ├── main.jsx                   entry point
    ├── App.jsx
    ├── index.css                  global styles
    ├── constants.js               state types, edge kinds, colours
    ├── context/
    │   └── CallCanvasContext.jsx  flow state, autosave, import/export, actions
    ├── components/
    │   ├── CallCanvas.jsx         wraps the app in its providers
    │   ├── Canvas.jsx             page layout and all canvas interaction logic
    │   ├── CallCanvas.css         styles for the whole app
    │   ├── layout/
    │   │   ├── Toolbar.jsx        header (Fit / Import / Export / Clear)
    │   │   ├── Sidebar.jsx        node palette and "How to use" guide
    │   │   └── DescriptionPanel.jsx  right-hand descriptions list
    │   ├── nodes/
    │   │   ├── GenericNode.jsx    editable bot-utterance node
    │   │   ├── StateNode.jsx      WFM / FTU / OOC / HUP node
    │   │   └── StatePill.jsx      coloured state label
    │   └── edges/
    │       ├── FlowEdge.jsx       labelled, colour-coded edge
    │       ├── GroupEdge.jsx      dashed "attached" link
    │       └── EdgeMarkers.jsx    arrow heads for each edge kind
    └── utils/
        └── logger.js
```

**Where to start:**
- To add a new state type, edit `STATE_TYPES` in `src/constants.js`.
- To change edge kinds or colours, edit `EDGE_KINDS` in the same file.
- How the flow is stored and changed lives in `src/context/CallCanvasContext.jsx`.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/my-change`
2. Make your changes and check them with `npm run dev`
3. Make sure `npm run build` succeeds
4. Commit, push, and open a pull request that describes what you changed and why

Found a bug or have an idea? [Open an issue](https://github.com/saksheesachan003/call-canvas/issues).
