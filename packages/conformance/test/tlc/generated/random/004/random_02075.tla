(*---
description: Evaluates a random set expression, seed 262, number 2075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({2, 1, 3} \cap {1, 2}) \cap {b3304 \in {x \in 1..3 : x > 1} : FALSE}) \ (DOMAIN [x \in Nat |-> x + 1] \ (<<>> \ SUBSET {1}))) \cup ((UNION {1..3, Nat} \cup ({2, 1, 3} \cup 2..1)) \cup (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ [[x \in Nat |-> x + 1] EXCEPT ![2] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02075 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
