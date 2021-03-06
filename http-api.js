const http = require('http')
const url = require('url')
const path = require('path')

const logger = require('./logger')
const core = require('./core')

const HOSTNAME = '127.0.0.1'
const PORT = 3000

async function downloadFile (srvUrl, res) {
    if (typeof srvUrl.query !== 'object' || !('file' in srvUrl.query)) {
        throw URIError('File path is not specified')
    }
    let filePath, file
    [filePath, file] = core.getFile(srvUrl.query['file'])

    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
    })

    file.pipe(res)

    await new Promise((resolve, reject) => {
        file.on('error', reject)
            .on('end', resolve)
        res.on('close', file.destroy)
    })
}

const server = http.createServer(async (req, res) => {
    try {
        const srvUrl = url.parse(req.url, true)

        logger.info(req.method, req.url)

        switch (srvUrl.pathname) {
            case '/fibonacci':
            case '/factorial':
                if (typeof srvUrl.query === 'object' && 'i' in srvUrl.query) {
                    const n = parseInt(srvUrl.query['i'], 10)

                    const result = await core.getResult(srvUrl.pathname.slice(1), n).toString()

                    res.writeHead(200, {'Content-Type': 'text/plain'})
                    res.end(result)
                } else {
                    throw TypeError('Invalid function argument')
                }
                break

            case '/download':
                await downloadFile(srvUrl, res)
                break

            case '/favicon.ico':
                res.writeHead(200, {'Content-Type': 'image/x-icon'})
                res.end()
                break

            default:
                res.writeHead(404, {'Content-Type': 'text/plain'})
                res.end('404 Page not found\n')
                logger.error(404, 'Page not found')
        }
    } catch (e) {
        e.code = getErrorReaction(e)

        res.writeHead(e.code, {'Content-Type': 'text/plain'})
        res.end(e.message)
        logger.error(`${e.stack}`)
    }
})

function getErrorReaction (e) {
    return {
        'RangeError': 400,
        'URIError': 404,
        'TypeError': 500,
        'ENOENT': 404,
    }[e.name] || 500
}

if (require.main === module) {
    server.listen(PORT, HOSTNAME, () => {
        logger.info(`Server running at http://${HOSTNAME}:${PORT}/`)
    })
}

exports.listen = (...args) => {
    server.listen(...args)
}

exports.close = (callback) => {
    server.close(callback)
}
