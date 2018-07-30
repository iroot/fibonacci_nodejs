const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const readFile = promisify(fs.readFile);

const hostname = '127.0.0.1';
const port = 3000;


function fibonacci(n) {
    let a = 0, b = 1;

    if (n === 0 || n === 1) {
        return n;
    }

    for (let i = 2; i <= n; ++i) {
        [a, b] = [b, a + b];
    }

    return b;
}

function factorial(n) {
    let mul = 1;

    if (n !== 0) {
        for (let i = 1; i <= n; ++i) {
            mul *= i
        }
    }

    return mul;
}

const downloadFile = async(srvUrl, res) => {
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

    let extName = path.extname(filePath);
    let contentType = {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.txt': 'text/plain',
        '.html': 'text/html',
    }[extName] || 'text/plain';

    await readFile(filePath)
    .then(content => {
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf8');
    });
};

function getResult(funcName, n) {
    if (!Number.isInteger(n)) {
        throw TypeError;
    } else if (n < 0) {
        throw RangeError("Input value is negative");
    }

    switch (funcName) {
        case 'fibonacci':
            if (n > 1476) {
                return Infinity;
            } else {
                return fibonacci(n);
            }
        case 'factorial':
            if (n > 170) {
                return Infinity;
            } else {
                return factorial(n);
            }
        default:
            throw URIError("Function not found");
    }
}

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

this.server = http.createServer(async(req, res) => {
    if (req.url === '/favicon.ico') {
        res.writeHead(200, {'Content-Type': 'image/x-icon'});
        res.end();
        return;
    }

    try {
        const srvUrl = url.parse(req.url, true);

        switch (srvUrl.pathname) {
            case '/fibonacci':
            case '/factorial':
                if (typeof srvUrl.query === 'object' && 'i' in srvUrl.query) {
                    const n = parseInt(srvUrl.query['i'], 10);

                    const result = getResult(srvUrl.pathname.slice(1), n).toString();

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
        }
    } catch (e) {
        // let {code, message} = getErrorReaction(e.name);
        let message = `${e.stack}`;

        res.writeHead(code, {'Content-Type': 'text/plain'});
        res.end(message);
        console.error(message);
    }
});


if (process.argv[2] === "server") {
    this.server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
} else if (process.argv[2] in ['fibonacci', 'factorial']) {
    try {
        console.log(getResult(process.argv[2], parseInt(process.argv[3], 10)));
    } catch (e) {
        // let [code, message] = getErrorReaction(e);
        console.error(e.stack);
    }
}


exports.listen = function () {
    this.server.listen.apply(this.server, arguments);
};

exports.close = function (callback) {
    this.server.close(callback);
};
