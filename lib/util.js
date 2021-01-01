module.exports = { successResponse, badRequestResponse, unauthorizedResponse, notFoundResponse, errorResponse, authenticate }

function successResponse(res, data=null) {
    if (data) {
        return res.status(200).send({
            success: true,
            data: data
        });
    } else {
        return res.status(200).send({
            success: true
        });
    }
}

function badRequestResponse(res, errorMsg = 'Bad request') {
    return res.status(400).send({
        success: false,
        errorMsg: errorMsg
    });
}

function unauthorizedResponse(res, errorMsg = 'Unauthorized') {
    return res.status(401).send({
        success: false,
        errorMsg: errorMsg
    });
}

function notFoundResponse(res, errorMsg = 'Not found') {
    return res.status(404).send({
        success: false,
        errorMsg: errorMsg
    });
}

function errorResponse(res, errorMsg = 'Internal server error') {
    return res.status(500).send({
        success: false,
        errorMsg: errorMsg
    });
}

function authenticate(key) {
    return true;
}