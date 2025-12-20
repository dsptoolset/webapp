import { combinations } from '../../../../src/app/components/core/math';

const result = combinations(4, 2);

console.assert(
    JSON.stringify(result) == JSON.stringify([
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
    ]),
    '(4, 2) failed'
);

console.log('OK');
