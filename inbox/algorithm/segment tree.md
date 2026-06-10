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
/// 线段树结构体，同时维护区间最大值和最小值
/// tree 中每个节点存储一个元组 (max, min)
#[derive(Debug)]
struct SegmentTree {
    n: usize,                   // 原始数组长度
    tree: Vec<(i32, i32)>,      // 线段树数组，每个节点存 (区间最大值, 区间最小值)
}

impl SegmentTree {
    /// 构造函数：从原始数组构建线段树
    /// vector: 原始数组
    pub fn new(vector: Vec<i32>) -> SegmentTree {
        let mut tree = SegmentTree {
            n: vector.len(),
            // 线段树数组开 4*n 空间，初始化为 (0, 0)
            // 4*n 是满二叉树的最坏情况所需空间
            tree: std::iter::repeat_n((0, 0), 4 * vector.len()).collect(),
        };
        // 从根节点(索引0)开始递归构建，初始区间 [0, n-1]
        tree.build(&vector, 0, 0, tree.n - 1);
        tree
    }

    /// 递归构建线段树
    /// vector: 原始数组引用
    /// index:  当前节点在线段树数组中的索引
    /// left:   当前节点代表的区间左端点
    /// right:  当前节点代表的区间右端点
    fn build(&mut self, vector: &Vec<i32>, index: usize, left: usize, right: usize) {
        // 递归终止：叶子节点，区间长度为 1
        if left == right {
            // 叶子节点的最大值和最小值都是原数组对应元素
            self.tree[index] = (vector[left], vector[left]);
            return;
        }

        // 计算中点，将区间分为左右两半
        let mid = (left + right) / 2;

        // 递归构建左子树：节点编号 index*2+1，区间 [left, mid]
        self.build(vector, index * 2 + 1, left, mid);
        // 递归构建右子树：节点编号 index*2+2，区间 [mid+1, right]
        self.build(vector, index * 2 + 2, mid + 1, right);

        // 获取左右子节点的值
        let left_node = self.tree[index * 2 + 1];
        let right_node = self.tree[index * 2 + 2];

        // 当前节点的值 = (左子树最大值和右子树最大值的较大者,
        //               左子树最小值和右子树最小值的较小者)
        self.tree[index] = (
            left_node.0.max(right_node.0),  // 区间最大值
            left_node.1.min(right_node.1),  // 区间最小值
        );
    }

    /// 递归查询区间 [query_left, query_right] 内的 (最大值, 最小值)
    /// index:       当前节点索引
    /// left, right: 当前节点代表的区间
    /// query_left, query_right: 要查询的目标区间
    fn query(
        &self,
        index: usize,
        left: usize,
        right: usize,
        query_left: usize,
        query_right: usize,
    ) -> (i32, i32) {
        // 情况 1：当前节点区间完全包含在查询区间内
        // 直接返回当前节点存储的 (max, min)
        if query_left <= left && query_right >= right {
            return self.tree[index];
        }

        // 情况 2：当前节点区间与查询区间无交集
        // 返回不影响结果的单位元：
        // 最大值查询的单位元是负无穷(i32::MIN)，最小值查询的单位元是正无穷(i32::MAX)
        if right < query_left || left > query_right {
            return (i32::MIN, i32::MAX);
        }

        // 情况 3：部分重叠，需要递归查询左右子树
        let mid = (left + right) / 2;

        // 查询左子树 [left, mid]
        let left_result = self.query(index * 2 + 1, left, mid, query_left, query_right);
        // 查询右子树 [mid+1, right]
        let right_result = self.query(index * 2 + 2, mid + 1, right, query_left, query_right);

        // 合并左右子树的查询结果
        (
            left_result.0.max(right_result.0),  // 取两边最大值的较大者
            left_result.1.min(right_result.1),  // 取两边最小值的较小者
        )
    }

    /// 公共接口：区间查询
    /// 隐藏内部递归参数，对外暴露简洁的 API
    pub fn range_query(&self, query_left: usize, query_right: usize) -> (i32, i32) {
        self.query(0, 0, self.n - 1, query_left, query_right)
    }

    /// 递归单点更新：将原数组中 origin_index 位置的值改为 value
    /// index, left, right: 当前节点信息（递归用）
    /// origin_index: 要修改的原数组索引
    /// value: 新值
    fn update(
        &mut self,
        index: usize,
        left: usize,
        right: usize,
        origin_index: usize,
        value: i32,
    ) {
        // 递归终止：找到叶子节点（对应单个元素）
        if left == right {
            // 更新叶子节点的最大值和最小值
            self.tree[index] = (value, value);
            return;
        }

        // 计算中点，判断 origin_index 在左子树还是右子树
        let mid = (left + right) / 2;

        if origin_index <= mid {
            // 目标在左半区间 [left, mid]
            self.update(index * 2 + 1, left, mid, origin_index, value);
        } else {
            // 目标在右半区间 [mid+1, right]
            self.update(index * 2 + 2, mid + 1, right, origin_index, value);
        }

        // 子节点更新后，重新计算当前节点的值（向上回溯更新）
        let left_node = self.tree[index * 2 + 1];
        let right_node = self.tree[index * 2 + 2];
        self.tree[index] = (
            left_node.0.max(right_node.0),  // 重新计算区间最大值
            left_node.1.min(right_node.1),  // 重新计算区间最小值
        )
    }

    /// 公共接口：单点更新
    /// 隐藏内部递归参数
    pub fn range_update(&mut self, origin_index: usize, value: i32) {
        self.update(0, 0, self.n - 1, origin_index, value);
    }
}

// ==================== 使用示例 ====================

fn main() {
    let arr = vec![1, 3, 5, 7, 9, 11];
    println!("原始数组: {:?}", arr);

    // 构建线段树
    let mut st = SegmentTree::new(arr.clone());

    // 查询整个区间的最大值和最小值
    let (max_val, min_val) = st.range_query(0, 5);
    println!("区间 [0,5] 最大值={}, 最小值={}", max_val, min_val); // 11, 1

    // 查询子区间 [1, 4] -> [3, 5, 7, 9]
    let (max_val, min_val) = st.range_query(1, 4);
    println!("区间 [1,4] 最大值={}, 最小值={}", max_val, min_val); // 9, 3

    // 单点更新：将索引 2 的值从 5 改为 100
    st.range_update(2, 100);

    // 更新后再次查询
    let (max_val, min_val) = st.range_query(0, 5);
    println!("更新后 [0,5] 最大值={}, 最小值={}", max_val, min_val); // 100, 1

    let (max_val, min_val) = st.range_query(1, 4);
    println!("更新后 [1,4] 最大值={}, 最小值={}", max_val, min_val); // 100, 3
}

```

