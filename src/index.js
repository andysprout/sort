const readline = require('readline');
const fs = require('fs');
const Stream = require('stream').Duplex;

const BUFFER_SIZE = 1000;

const arrayToSortedBuffer = array => {
    const buffer = Buffer.allocUnsafe(array.length * 4);
    array.sort((a, b) => a - b).forEach((n, i) => buffer.writeInt32BE(n, i * 4));
    return {
        offset: 4,
        buffer,
        head: buffer.readInt32BE(0)
    };
};

const sort = (fileName) => {
    const buffers = [];
    let array = [];

    const out = new Stream({
        read() {},
        write(chunk, encoding, callback) {
            array.push(parseInt(chunk.toString(), 10));
            if (array.length >= BUFFER_SIZE) {
                buffers.push(arrayToSortedBuffer(array));
                array = [];
            }
            callback();
        }
    });

    out.on('finish', () => {
        if (array.length) {
            buffers.push(arrayToSortedBuffer(array));
        }
        while(true) {
            let minN = Number.MAX_VALUE;
            const index = buffers.reduce((minIndex, {head}, i) => {
                if (head !== null && head < minN) {
                    minN = head;
                    return i;
                }
                return minIndex;
            }, Number.MAX_VALUE);
            if (index === Number.MAX_VALUE) {
                out.end();
                return;
            }
            out.push(minN + '\n');
            const {offset, buffer} = buffers[index];
            buffers[index] = offset >= buffer.length ? 
                {head: null} :
                {offset: offset + 4, buffer, head: buffer.readInt32BE(offset)};
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
