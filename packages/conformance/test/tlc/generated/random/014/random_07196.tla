(*---
description: Evaluates a random set expression, seed 262, number 7196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([b11057 \in Nat |-> 2] @@ (-1 :> 7)) EXCEPT ![(LET b11058 == 0 IN b11058 * ([x \in 1..2 |-> x])[7])] = IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN ([a |-> 1, b |-> TRUE]).a ELSE ([x \in 1..2 |-> x])[[a |-> 1]]] \cap ((Head(<<1, 2>>) + {b11059 : b11059 \in SUBSET {1}}) \ ({b11060 \in 1..3 : <<1, 2>>} \ (<<1>> \cap {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
