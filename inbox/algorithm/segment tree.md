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

## 节点编号与空间复杂度

采用数组存储的满二叉树编号方式（本笔记代码以 0 为根）：

- 根节点：索引 `0`
- 节点 `i` 的左孩子：`2*i + 1`，右孩子：`2*i + 2`
- 节点 `i` 的父节点：`(i - 1) / 2`

**为什么要开 4n 空间？**

线段树的深度为 `⌈log₂n⌉ + 1`。当 n 不是 2 的幂时，最后一层会"溢出"到下一层，数组存储需要按满二叉树预留空间，即 `2^(⌈log₂n⌉+1)` 个节点。最坏情况（如 n = 2^k + 1）约为 4n，因此惯例直接开 `4 * n`，省去精确计算。

---

## 基本操作

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| 建树 | O(n) | 递归构建每个节点 |
| 单点更新 | O(log n) | 修改一个元素，更新路径上的所有节点 |
| 区间查询 | O(log n) | 查询某区间的聚合值 |
| 区间更新 | O(log n) | 使用懒标记（Lazy Propagation） |

---

## 懒标记（Lazy Propagation）

**问题**：区间更新（如"把 [l, r] 内每个元素都加 v"）若逐个单点更新，复杂度退化为 O(n log n)。

**思路**：更新时只下沉到"被查询区间完全覆盖"的节点，在该节点打上一个**懒标记**，表示"这棵子树整体需要加 v，但还没真正传给孩子"。之后**真正需要访问其孩子时**（查询或更新经过该节点），才把标记下推（push down）一层。

三个关键动作：

1. **打标记**：节点区间被更新区间完全覆盖时，更新自身聚合值 + 记录懒标记，立即返回（不再递归）。
2. **下推（push down）**：访问孩子前，把当前节点的懒标记应用到两个孩子（更新孩子的聚合值和懒标记），然后清空自己的标记。
3. **上推（push up）**：孩子更新完后，由孩子的值重新计算当前节点的聚合值。

这样单次区间更新只触碰 O(log n) 个节点。

> 注意：懒标记的"叠加"必须满足结合性。区间加法标记可以直接累加；若同时支持"区间赋值 + 区间加"两种标记，需要规定优先级（赋值会清空加法标记）。

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

## 代码示例一：单点更新 + 区间查询（Rust）

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

---

## 代码示例二：区间更新（懒标记）+ 区间求和（Rust）

```rust
/// 支持区间加法 + 区间求和的线段树（带懒标记）
/// 节点编号方式与示例一相同：根为 0，孩子为 2i+1 / 2i+2
struct LazySegmentTree {
    n: usize,
    sum: Vec<i64>,   // 每个节点存储区间和
    lazy: Vec<i64>,  // 懒标记：该子树整体待加的值（0 表示无标记）
}

impl LazySegmentTree {
    pub fn new(vector: &[i64]) -> LazySegmentTree {
        let n = vector.len();
        let mut st = LazySegmentTree {
            n,
            sum: vec![0; 4 * n],
            lazy: vec![0; 4 * n],
        };
        st.build(vector, 0, 0, n - 1);
        st
    }

    fn build(&mut self, vector: &[i64], index: usize, left: usize, right: usize) {
        if left == right {
            self.sum[index] = vector[left];
            return;
        }
        let mid = (left + right) / 2;
        self.build(vector, index * 2 + 1, left, mid);
        self.build(vector, index * 2 + 2, mid + 1, right);
        // push up：由孩子重新计算当前节点
        self.sum[index] = self.sum[index * 2 + 1] + self.sum[index * 2 + 2];
    }

    /// push down：访问孩子之前，把当前节点的懒标记下推一层
    /// left_len / right_len 分别是左右孩子区间的长度（求和需要乘以区间长度）
    fn push_down(&mut self, index: usize, left_len: usize, right_len: usize) {
        if self.lazy[index] != 0 {
            let add = self.lazy[index];
            // 标记传给孩子（孩子的标记是"累加"，不能直接覆盖）
            self.lazy[index * 2 + 1] += add;
            self.lazy[index * 2 + 2] += add;
            // 同时更新孩子的聚合值
            self.sum[index * 2 + 1] += add * left_len as i64;
            self.sum[index * 2 + 2] += add * right_len as i64;
            // 清空自己的标记
            self.lazy[index] = 0;
        }
    }

    fn update(&mut self, index: usize, left: usize, right: usize,
              ql: usize, qr: usize, add: i64) {
        // 完全覆盖：更新自身 + 打懒标记，不再向下递归
        if ql <= left && right <= qr {
            self.sum[index] += add * (right - left + 1) as i64;
            self.lazy[index] += add;
            return;
        }
        let mid = (left + right) / 2;
        self.push_down(index, mid - left + 1, right - mid);
        if ql <= mid {
            self.update(index * 2 + 1, left, mid, ql, qr, add);
        }
        if qr > mid {
            self.update(index * 2 + 2, mid + 1, right, ql, qr, add);
        }
        self.sum[index] = self.sum[index * 2 + 1] + self.sum[index * 2 + 2];
    }

    fn query(&mut self, index: usize, left: usize, right: usize,
             ql: usize, qr: usize) -> i64 {
        if ql <= left && right <= qr {
            return self.sum[index];
        }
        let mid = (left + right) / 2;
        // 查询同样要先下推标记，否则孩子的值是"过期"的
        self.push_down(index, mid - left + 1, right - mid);
        let mut result = 0;
        if ql <= mid {
            result += self.query(index * 2 + 1, left, mid, ql, qr);
        }
        if qr > mid {
            result += self.query(index * 2 + 2, mid + 1, right, ql, qr);
        }
        result
    }

    /// 公共接口：区间 [l, r] 每个元素加 add
    pub fn range_add(&mut self, l: usize, r: usize, add: i64) {
        self.update(0, 0, self.n - 1, l, r, add);
    }

    /// 公共接口：查询区间 [l, r] 的和
    pub fn range_sum(&mut self, l: usize, r: usize) -> i64 {
        self.query(0, 0, self.n - 1, l, r)
    }
}

fn main() {
    let arr = vec![1, 3, 5, 7, 9, 11];
    let mut st = LazySegmentTree::new(&arr);

    println!("初始 [0,5] 和 = {}", st.range_sum(0, 5)); // 36

    st.range_add(1, 3, 10); // [1, 13, 15, 17, 9, 11]
    println!("区间加后 [0,5] 和 = {}", st.range_sum(0, 5)); // 66
    println!("区间加后 [2,4] 和 = {}", st.range_sum(2, 4)); // 41
}
```

---

## 常见易错点

1. **中点溢出**：`(left + right) / 2` 在 left、right 极大时可能溢出，更稳妥的写法是 `left + (right - left) / 2`（Rust 中 usize 区间一般不会溢出，但 C/C++ 的 int 很容易踩坑）。
2. **无交集时的返回值**：必须返回该操作的**单位元**（求和返回 0，求最大值返回 `i32::MIN`，求最小值返回 `i32::MAX`，求 GCD 返回 0），否则会污染合并结果。
3. **查询前忘记 push down**：懒标记版本中，查询路径经过有标记的节点时也必须下推，否则读到的是过期数据。
4. **标记是累加还是覆盖**：区间加标记下推时用 `+=`；区间赋值标记用覆盖，且需要额外的"是否有标记"判断（赋值 0 是合法标记，不能用 0 表示无标记）。
5. **空数组**：`n == 0` 时 `n - 1` 会下溢（usize），构造前应特判。
6. **求和溢出**：区间和容易超出 i32 范围，聚合值建议用 i64（如示例二）。

---

## 进阶变体

| 变体 | 解决的问题 | 核心思路 |
|------|-----------|---------|
| **动态开点线段树** | 值域很大（如 1e9）但操作次数少，无法预分配 4n 数组 | 按需创建节点，用索引/指针引用孩子，空间 O(q log V) |
| **可持久化线段树（主席树）** | 查询"历史版本"或区间第 k 小 | 每次修改只新建路径上的 O(log n) 个节点，旧版本节点共享 |
| **zkw 线段树（迭代版）** | 递归常数大 | 自底向上非递归实现，代码短、常数小，但不易扩展懒标记 |
| **线段树合并** | 树上启发式合并类问题 | 递归合并两棵动态开点线段树 |
| **线段树二分** | "查询第一个满足条件的位置" | 利用节点聚合值在树上直接二分，O(log n) 而非 O(log² n) |
| **扫描线 + 线段树** | 矩形面积并、周长并 | 按 x 扫描，线段树维护 y 方向被覆盖的长度 |

---

## 经典练习题

- [LeetCode 307. 区域和检索 - 数组可修改](https://leetcode.cn/problems/range-sum-query-mutable/) — 单点更新 + 区间求和（入门模板题）
- [LeetCode 715. Range 模块](https://leetcode.cn/problems/range-module/) — 区间赋值 + 动态开点
- [LeetCode 729/731/732. 我的日程安排表 I/II/III](https://leetcode.cn/problems/my-calendar-iii/) — 区间加 + 区间最大值 + 动态开点
- [LeetCode 315. 计算右侧小于当前元素的个数](https://leetcode.cn/problems/count-of-smaller-numbers-after-self/) — 值域线段树/离散化
- [LeetCode 2407. 最长递增子序列 II](https://leetcode.cn/problems/longest-increasing-subsequence-ii/) — 线段树优化 DP
- [洛谷 P3372 【模板】线段树 1](https://www.luogu.com.cn/problem/P3372) — 区间加 + 区间求和（懒标记模板题）
- [洛谷 P3373 【模板】线段树 2](https://www.luogu.com.cn/problem/P3373) — 区间加 + 区间乘（双懒标记）

