const readline = require('readline');
const fs = require('fs');
const Stream = require('stream').Duplex;
const Tree = require('./tree');

const BUFFER_SIZE = 10000;

const sort = (fileName) => {
    const tree = Tree(BUFFER_SIZE);

    const out = new Stream({
        read() {},
        write(chunk, encoding, callback) {
            tree.add(parseInt(chunk.toString(), 10));
            callback();
        }
    });

    out.on('finish', () => tree.drain(n => out.push(n + '\n'), () => {}));

    const rl = readline.createInterface({
        input: fs.createReadStream(fileName)
    });
    rl.on('line', line => out.write(line));
    rl.on('close', () => out.end());
    return out;
};

module.exports = {sort};
