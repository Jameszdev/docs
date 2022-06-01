import React, { useEffect, useCallback, useState } from 'react'
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { useParams } from "react-router-dom"

import { io } from "socket.io-client"

const SAVE_INTERVAL_MS = 2000
const TOOLBAR_OPTOINS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
    const { id: documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    const [saveStatus, setSaveStatus] = useState("")

    useEffect(() => {
      const soc = io("http://localhost:3001")
      setSocket(soc)
      console.log("[WS] Connected to the WebSocket.")

      return () => {
        console.log("[WS] Disconnecting from WebSocket.")
        soc.disconnect()
      }
    }, [])

    useEffect(() => {
      if (socket == null || quill == null) return

      socket.once("load-document", document => {
        quill.setContents(document)
        quill.enable()
      })

      socket.emit("get-document", documentId)
    }, [socket, quill, documentId])

    useEffect(() => {
      if (socket == null || quill == null) return

      socket.on("saved-document", doc => {
        setSaveStatus("Saved")
      })

      const interval = setInterval(() => {
        setSaveStatus("Saving Changes...")
        socket.emit("save-document", quill.getContents())
      }, SAVE_INTERVAL_MS)

      return () => {
        clearInterval(interval)
      }
    }, [socket, quill])

    useEffect(() => {
      if (socket == null || quill == null) return

      const handler = delta => {
        quill.updateContents(delta)
      }

      socket.on("receive-changes", handler)

      return () => {
        socket.off("receive-changes", handler)
      }

    }, [socket, quill])

    useEffect(() => {
      if (socket == null || quill == null) return

      const handler = (delta, oldDelta, source) => {
        if (source !== "user") return;
        socket.emit("send-changes", delta)
      }

      quill.on("text-change", handler)

      return () => {
        quill.off("text-change", handler)
      }

    }, [socket, quill])

    const wrapperRef = useCallback((wrapper) => {
      if (wrapper == null) return;

      wrapper.innerHTML = "";
      const editor = document.createElement("div")
      wrapper.append(editor)
      const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTOINS }} )
      q.disable()
      q.setText("Loading...")
      setQuill(q)
    }, [])
  return (
    <>
    {/* <p>{saveStatus}</p> */}
    <div className="container" ref={wrapperRef}></div>
    </>
  )
}
