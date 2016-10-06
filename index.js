const {sort} = require('./src');
const fileName = process.argv[2];
sort(fileName).pipe(process.stdout);
