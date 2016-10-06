const Tree = (size) => {
    let buffer = Buffer.allocUnsafe(size * 4);
    let offset = 0;
    let sum = 0;
    let left, right, mid;

    const partition = x => {
        if (x >= mid) {
            right.add(x);
        } else {
            left.add(x);
        }
    };

    return {
        add: n => {
            if (buffer) {
                if (offset >= buffer.length) {
                    left = Tree(size);
                    right = Tree(size);
                    mid = sum / size;
                    for (let i=0; i<offset; i+=4) {
                        partition(buffer.readInt32BE(i));
                    }
                    partition(n);
                    buffer = null;
                } else {
                    offset = buffer.writeInt32BE(n, offset);
                    sum += n;
                }
            } else {
                partition(n);
            }
        },
        drain: (cb, done) => {
            if (buffer) {
                const array = [];
                for (let i=0; i<offset; i+=4) {
                    array.push(buffer.readInt32BE(i));
                }
                array.sort((a, b) => a - b).forEach(n => cb(n));
                done();
            } else {
                left.drain(cb, () => right.drain(cb, done));
            }
        }
    };
};

module.exports = Tree;