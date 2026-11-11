(*---
description: Evaluates a random bool expression, seed 262, number 7818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12069 \in (([x \in 1..2 |-> x] @@ <<1>>) @@ (0 :> 2147483647)) : (\A b12070 \in UNION {{1, 2}, Nat} : (1..3 \subseteq {2, 1, 3}))} \subseteq ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) @@ ((2 - 2147483647) :> ({x \in 1..3 : x > 1} \cup SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07818 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    (0 :> 2147483647 @@ 1 :> 1 @@ 2 :> 2)
    is not enumerable
---*)
