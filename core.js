const fs = require('fs')
const path = require('path')

function fibonacci (n) {
    let a = 0, b = 1

    if (n === 0 || n === 1) {
        return n
    }

    for (let i = 2; i <= n; ++i) {
        [a, b] = [b, a + b]
    }

    return b
}

function factorial (n) {
    let mul = 1

    if (n !== 0) {
        for (let i = 1; i <= n; ++i) {
            mul *= i
        }
    }

    return mul
}

function getFileStream (filePath) {
    const rootDir = path.resolve(__dirname, 'public')
    filePath = path.join(rootDir, filePath)
    if (filePath.indexOf(rootDir) !== 0) {
        throw URIError('Directory traversal')
    }

    if (!fs.existsSync(filePath)) {
        throw URIError('No such file or directory')
    }

    return [filePath, fs.createReadStream(filePath)]
}

function getResult (funcName, n) {
    if (!Number.isInteger(n)) {
        throw TypeError('Input value is not integer')
    } else if (n < 0) {
        throw RangeError('Input value is negative')
    }

    switch (funcName) {
        case 'fibonacci':
            if (n > 1476) {
                return Infinity
            } else {
                return fibonacci(n)
            }
        case 'factorial':
            if (n > 170) {
                return Infinity
            } else {
                return factorial(n)
            }
        default:
            throw URIError('Function not found')
    }
}

module.exports = {
    getResult: getResult,
    getFile: getFileStream
}
