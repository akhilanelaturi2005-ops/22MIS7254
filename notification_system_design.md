# Stage 1

## Architectural Strategy: Priority Inbox Sorting Mechanism

### 1. Algorithm & Data Weights
To deliver a dynamic, client-side Priority Inbox tracking system that handles continuous updates natively without a stateful database, notifications are calculated and sorted using a composition of **Type Weight** and **Recency Timestamps**.

We assign strict mathematical hierarchical values to metadata properties:
* `Placement` = Weight 3
* `Result` = Weight 2
* `Event` = Weight 1

### 2. Tie-Breaking Strategy
When sorting items within the same classification (e.g., matching weights between two separate records of type `Placement`), the algorithm evaluates UNIX Epoch execution timestamps derived from the ISO `Timestamp` string. 

Sorting logic executes using sequential sorting metrics:
1. Primary sort organized descending by categorical `Weight`.
2. Secondary fallback tie-breaker sorted descending by Unix epoch microsecond integer fields (`Recency`).

### 3. Maintaining Top "n" Stream Items Efficiently
To optimally scale evaluation overhead as items stream continuously into client frameworks, we utilize an in-memory sliding buffer array bound to the pagination limit window. Because the dataset updates dynamically from an explicit REST infrastructure array, calculating complex subsets can use javascript execution contexts:

* **Time Complexity**: O(K log K) sorting execution bound strictly to active pagination page sizes (K), minimizing performance latency.
* **Space Complexity**: O(K) active references loaded in volatile state memory arrays.
