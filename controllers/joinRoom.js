const joinRoom = async (req, res) => {
    console.log("Request Data: ", req.body);
    res.end("Working")
}

export { joinRoom };