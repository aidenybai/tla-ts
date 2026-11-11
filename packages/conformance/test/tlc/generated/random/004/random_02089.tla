(*---
description: Evaluates a random set expression, seed 262, number 2089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b3327 \in {(1 - 2147483647), IF FALSE THEN 2 ELSE 2} : (\E b3328 \in {b3327 : b3329 \in 2..1} : ([a |-> 1] = [a |-> 1, b |-> TRUE]))} \cap DOMAIN ([b3330 \in 2..1 |-> b3330] @@ [[x \in Nat |-> x + 1] EXCEPT ![0] = 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02089 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
