# Segment Tree
线段树（Segment Tree）是一种高效的数据结构，用于处理区间查询和区间更新问题。以下是它的核心要点：

---

## 核心思想

将数组递归地划分为左右两半，构建一棵二叉树。每个节点存储对应区间的聚合信息（如和、最大值、最小值等）。

```
原始数组: [1, 3, 5, 7, 9, 11]
线段树:
        [0,5] sum=36
       /        \
   [0,2] sum=9  [3,5] sum=27
   /    \        /    \
[0,1]  [2,2]  [3,4]  [5,5]
 /  \          /  \
[0,0][1,1]  [3,3][4,4]
```

---

## 基本操作

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| 建树 | O(n) | 递归构建每个节点 |
| 单点更新 | O(log n) | 修改一个元素，更新路径上的所有节点 |
| 区间查询 | O(log n) | 查询某区间的聚合值 |
| 区间更新 | O(log n) | 使用懒标记（Lazy Propagation） |

---

## 典型应用场景

- **区间求和 / 区间最值**：如"查询数组第 2 到第 5 个元素的和"
- **区间修改**：如"将第 2 到第 5 个元素都加 3"
- **动态区间统计**：频繁修改 + 频繁查询的场景

---

## 与树状数组（BIT/Fenwick Tree）的对比

| 特性 | 线段树 | 树状数组 |
|------|--------|----------|
| 代码复杂度 | 较复杂 | 简洁 |
| 区间查询 | ✅ 支持 | ✅ 支持（前缀和差分） |
| 区间更新 | ✅ 支持（懒标记） | ⚠️ 部分场景需配合差分 |
| 功能扩展性 | 强（任意结合律操作） | 较弱 |

---

## 简单代码示例（Rust）

```rust
#[derive(Debug)]
struct SegmentTree {
    n: usize,
    tree: Vec<(i32, i32)>,
}

impl SegmentTree {
    pub fn new(vector: Vec<i32>) -> SegmentTree {
        let mut tree = SegmentTree {
            n: vector.len(),
            tree: std::iter::repeat_n((0, 0), 4 * vector.len()).collect(),
        };
        tree.build(&vector, 0, 0, tree.n - 1);
        tree
    }
    fn build(&mut self, vector: &Vec<i32>, index: usize, left: usize, right: usize) {
        if left == right {
            self.tree[index] = (vector[left], vector[left]);
            return;
        }
        let mid = (left + right) / 2;
        self.build(vector, index * 2 + 1, left, mid);
        self.build(vector, index * 2 + 2, mid + 1, right);
        let left_node = self.tree[index * 2 + 1];
        let right_node = self.tree[index * 2 + 2];
        self.tree[index] = (left_node.0.max(right_node.0), left_node.1.min(right_node.1));
    }
    fn query(
        &self,
        index: usize,
        left: usize,
        right: usize,
        query_left: usize,
        query_right: usize,
    ) -> (i32, i32) {
        if query_left <= left && query_right >= right {
            return self.tree[index];
        }
        if right < query_left || left > query_right {
            return (i32::MIN, i32::MAX);
        }
        let mid = left + (right - left) / 2;
        let left_result = self.query(index * 2 + 1, left, mid, query_left, query_right);
        let right_result = self.query(index * 2 + 2, mid + 1, right, query_left, query_right);
        (
            left_result.0.max(right_result.0),
            left_result.1.min(right_result.1),
        )
    }
    pub fn range_query(&self, query_left: usize, query_right: usize) -> (i32, i32) {
        self.query(0, 0, self.n - 1, query_left, query_right)
    }
    
    fn update(&mut self, index: usize, left: usize, right: usize, origin_index: usize, value: i32) {
        if left == right {
            self.tree[index] = (value, value);
            return;
        }
        let mid = left + (right - left) / 2;
        if origin_index <= mid {
            self.update(index * 2 + 1, left, mid, origin_index, value);
        } else {
            self.update(index * 2 + 2, mid + 1, right, origin_index, value);
        }
        let left_node = self.tree[index * 2 + 1];
        let right_node = self.tree[index * 2 + 2];
        self.tree[index] = (left_node.0.max(right_node.0), left_node.1.min(right_node.1))
    }
    
    pub fn point_update(&mut self, origin_index: usize, value: i32) {
        self.update(0, 0, self.n - 1, origin_index, value);
    }
}
```

