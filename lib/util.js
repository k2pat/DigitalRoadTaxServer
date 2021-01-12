module.exports = { successResponse, badRequestResponse, unauthorizedResponse, notFoundResponse, errorResponse, authenticate }

function successResponse(res, data=null) {
    if (data) {
        return res.status(200).send(data);
    } else {
        return res.status(200).send({});
    }
}

function badRequestResponse(res, errorMsg = 'Bad request') {
    return res.status(400).send({
        errorMsg: errorMsg
    });
}

function unauthorizedResponse(res, errorMsg = 'Unauthorized') {
    return res.status(401).send({
        errorMsg: errorMsg
    });
}

function notFoundResponse(res, errorMsg = 'Not found') {
    return res.status(404).send({
        errorMsg: errorMsg
    });
}

function errorResponse(res, errorMsg = 'Internal server error') {
    return res.status(500).send({
        errorMsg: errorMsg
    });
}

function authenticate(req) {
    return true;
}