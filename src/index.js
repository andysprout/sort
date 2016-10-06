const readline = require('readline');
const fs = require('fs');
const Stream = require('stream').Duplex;

const BUFFER_SIZE = 1000;

const sort = (fileName) => {
    const buffers = [];
    let buffer = Buffer.allocUnsafe(BUFFER_SIZE * 4);
    let counter = 0;

    const out = new Stream({
        read() {},
        write(chunk, encoding, callback) {
            const n = parseInt(chunk.toString(), 10);
            counter = buffer.writeInt32BE(n, counter);
            if (counter === buffer.length) {
                buffers.push(buffer);
                buffer = Buffer.allocUnsafe(BUFFER_SIZE * 4);
                counter = 0;
            }
            callback();
        }
    });

    out.on('finish', () => {
        if (counter) {
            buffers.push(buffer);
        }
        const sortedBuffers = buffers.map(b => {
            const array = [];
            for(let offset = 0; offset < b.length; offset += 4) {
                array.push(b.readInt32BE(offset));
            }
            const sortedBuffer = Buffer.allocUnsafe(BUFFER_SIZE * 4);
            array.sort((a, b) => a - b).forEach((n, i) => sortedBuffer.writeInt32BE(n, i * 4));
            return {
                offset: 4,
                buffer: sortedBuffer,
                head: sortedBuffer.readInt32BE(0)
            };
        });

        while(true) {
            let minN = Number.MAX_VALUE;
            const index = sortedBuffers.reduce((minIndex, {head}, i) => {
                if (head !== null && head < minN) {
                    minN = head;
                    return i;
                }
                return minIndex;
            }, Number.MAX_VALUE);
            if (index === Number.MAX_VALUE) {
                return;
            }
            const {offset, buffer, head} = sortedBuffers[index];
            out.push(head + '\n');
            sortedBuffers[index] = offset >= buffer.length ? 
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
