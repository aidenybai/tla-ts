const total = [1, 2, 3].reduce((sum, value) => sum + value, 0);
if (total !== 6) throw new Error("total");
