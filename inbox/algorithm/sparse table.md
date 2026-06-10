# SparseTable


```rust
use std::ops::{Deref, DerefMut};
struct SparseTable(Vec<Vec<(i32, i32)>>);
impl Deref for SparseTable {
    type Target = Vec<Vec<(i32, i32)>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for SparseTable {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl SparseTable {
    fn new(vector: &[i32]) -> Self {
        let mut st: Self = Self(vec![]);
        st.init(vector);
        st
    }
    fn init(&mut self, vector: &[i32]) {
        let n = vector.len();
        let k_max = (usize::BITS - n.leading_zeros()) as usize;
        self.push(vector.iter().map(|&i| (i, i)).collect());
        for k in 1..k_max {
            let len = 1 << k;
            let half = 1 << (k - 1);
            let mut level = vec![];
            for i in 0..(n - len + 1) {
                let left = self[k - 1][i];
                let right = self[k - 1][i + half];
                level.push((left.0.max(right.0), left.1.min(right.1)));
            }
            self.push(level);
        }
    }
    fn range_query(&self, left: usize, right: usize) -> (i32, i32) {
        let len = right - left + 1;
        let k = (usize::BITS - 1 - len.leading_zeros()) as usize;
        let block = 1usize << k;
        let left_range = self[k][left];
        let right_range = self[k][right + 1 - block];
        (
            left_range.0.max(right_range.0),
            left_range.1.min(right_range.1),
        )
    }
}
```

