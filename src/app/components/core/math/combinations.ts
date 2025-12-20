export const combinations = (n: number, k: number) => {
    const helper = (
        res: number[][],
        n: number,
        k: number,
        tmp: number[],
        currentIter: number
    ) => {
        if (tmp.length === k) {
            res.push([...tmp]);
            return;
        }

        for (let i = currentIter; i < n; i++) {
            tmp.push(i);
            helper(res, n, k, tmp, i + 1);
            tmp.pop();
        }
    };

    const res: number[][] = [];
    helper(res, n, k, [], 0);
    return res;
};
