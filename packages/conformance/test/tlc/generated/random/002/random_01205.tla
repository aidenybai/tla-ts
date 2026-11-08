(*---
description: Evaluates a random function expression, seed 262, number 1205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1939 \in DOMAIN ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) @@ [b1940 \in Nat |-> 3]) |-> ((CHOOSE b1941 \in ([x \in 1..2 |-> x] \cap {x \in 1..3 : x > 1}) : (2147483647 < b1941)) .. ((b1939 - b1939) \div (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01205 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
