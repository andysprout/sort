const readline = require('readline');
const fs = require('fs');
const Stream = require('stream').Duplex;

const BUFFER_SIZE = 1000;

const merge = (buffer, array) => {
    const result = Buffer.allocUnsafe(buffer.length + array.length * 4);
    let i = 0, j = 0, offset = 0;
    while (i < buffer.length || j < array.length) {
        if (i >= buffer.length || buffer.readInt32BE(i) > array[j]) {
            offset = result.writeInt32BE(array[j], offset);
            j += 1;
        } else {
            offset = result.writeInt32BE(buffer.readInt32BE(i), offset);
            i += 4;
        }
    }
    return result;
};

const bufferToArray = buffer => {
    const array = [];
    for(let offset = 0; offset < buffer.length; offset += 4) {
        array.push(buffer.readInt32BE(offset));
    }
    return array;
}

const sort = (fileName) => {
    let buffer = Buffer.allocUnsafe(0);
    let array = [];
 
    const out = new Stream({
        read() {},
        write(chunk, encoding, callback) {
            array.push(parseInt(chunk.toString(), 10));
            if (array.length >= BUFFER_SIZE) {
                buffer = merge(buffer, array.sort((a,b) => a - b));
                array = [];
            }
            callback();
        }
    });

    out.on('finish', () => {
        if (array.length) {
            buffer = merge(buffer, array.sort((a,b) => a - b));
        }
        for(let i=0; i<buffer.length; i+=4) {
            out.push(buffer.readInt32BE(i) + '\n');
        }
    });

    const rl = readline.createInterface({
        input: fs.createReadStream(fileName)
    });
    rl.on('line', line => out.write(line));
    rl.on('close', () => out.end());
    return out;
};

module.exports = {sort};
