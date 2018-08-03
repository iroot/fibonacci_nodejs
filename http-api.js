const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const logger = require('./logger');
const core = require('./core');


async function downloadFile(srvUrl, res) {
    let filePath;
    if (typeof srvUrl.query === 'object' && 'file' in srvUrl.query) {
        const rootDir = path.resolve(__dirname, 'public');
        filePath = path.join(rootDir, srvUrl.query['file']);
        if (filePath.indexOf(rootDir) !== 0) {
            throw URIError('Directory traversal');
        }
    } else {
        throw URIError("File path is not specified");
    }

    let file = fs.createReadStream(filePath);

    res.writeHead(200,
        {'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`});

    file.pipe(res);

    await new Promise((resolve, reject) => {
        file.on('error', reject)
            .on('end', resolve);
        res.on('close', file.destroy);
    });
}
const server = http.createServer(async(req, res) => {
    try {
        const srvUrl = url.parse(req.url, true);

        logger.info(req.method, req.url);

        switch (srvUrl.pathname) {
            case '/fibonacci':
            case '/factorial':
                if (typeof srvUrl.query === 'object' && 'i' in srvUrl.query) {
                    const n = parseInt(srvUrl.query['i'], 10);

                    const result = await core.getResult(srvUrl.pathname.slice(1), n).toString();

                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end(result);
                } else {
                    throw TypeError("Invalid function argument");
                }
                break;

            case '/download':
                await downloadFile(srvUrl, res);
                break;

            case '/favicon.ico':
                res.writeHead(200, {'Content-Type': 'image/x-icon'});
                res.end();
                break;

            default:
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('404 Page not found\n');
                logger.error(404, 'Page not found');
        }
    } catch (e) {
        let {code, message} = getErrorReaction(e);

        res.writeHead(code, {'Content-Type': 'text/plain'});
        res.end(e.stack);
        logger.error(`${e.stack}`);
    }
});

function getErrorReaction(e) {
    let res = {
        "RangeError": {
            code: 400,
            message: "Input value is negative"
        },
        "URIError": {
            code: 404,
            message: "Function not found"
        },
        "TypeError": {
            code: 500,
            message: "Invalid function argument"
        },
        "ENOENT": {
            code: 404,
            message: "File not found"
        }
    };

    return res[e.name] || {
        code: 500,
        message: ''
    };
}

exports.listen = (...args) => {
    server.listen(...args);
};

exports.close = (callback) => {
    server.close(callback);
};
