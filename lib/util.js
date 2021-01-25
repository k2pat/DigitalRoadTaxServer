module.exports = { successResponse, badRequestResponse, unauthorizedResponse, notFoundResponse, conflictResponse, errorResponse, authenticate }

function successResponse(res, data=null) {
    if (data) {
        return res.status(200).send(data);
    } else {
        return res.status(200).send({});
    }
}

function _badReponse(statusCode, res, errorMsg = 'Error', errorCode = null, data = {}) {
    let response = {
        errorCode: errorCode,
        errorMsg: errorMsg
    };
    response = {...response, ...data};
    return res.status(statusCode).send(response);
}

function badRequestResponse(res, errorMsg = 'Bad request', errorCode = null, data = {}) {
    _badReponse(400, res, errorMsg, errorCode, data);
}

function unauthorizedResponse(res, errorMsg = 'Unauthorized', errorCode = null, data = {}) {
    _badReponse(401, res, errorMsg, errorCode, data);
}

function notFoundResponse(res, errorMsg = 'Not found', errorCode = null, data = {}) {
    _badReponse(404, res, errorMsg, errorCode, data);
}

function conflictResponse(res, errorMsg = 'Conflict', errorCode = null, data = {}) {
    _badReponse(409, res, errorMsg, errorCode, data);
}

function errorResponse(res, errorMsg = 'Internal server error', errorCode = null, data = {}) {
    _badReponse(500, res, errorMsg, errorCode, data);
}

function authenticate(req) {
    return true;
}