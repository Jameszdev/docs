require("dotenv").config()
const mongoose = require('mongoose');
const Document = require("./schemas/Document")

const defaultValue = "a"

mongoose.connect(process.env.MongoURI)
    .then((result) => {
        console.log("Connected to MongoDB")
    })
    .catch((err) => {
        console.log(err)
    })


const io = require("socket.io")(3001, {
    cors: {
        origin: "http://localhost:3000",
        method: ["GET", "POST"]
    }
})

io.on("connection", socket => {
    socket.on("get-document", async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId)
        console.log(document)
        socket.emit("load-document", document.data)

        socket.on("send-changes", delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
            socket.emit("saved-document", Document)
        })
    })

})

async function findOrCreateDocument(id) {
    if (id == null) return 

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
}