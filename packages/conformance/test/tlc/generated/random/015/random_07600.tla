(*---
description: Evaluates a random set expression, seed 262, number 7600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b11694 \in (2..1 \cup 2..1) : ([x \in Nat |-> x + 1] => TRUE)} \ (({2, 1, 3} \cup 2..1) \cap {7, 7})), (~((7 .. 7) \subseteq {b11695 \in Nat : FALSE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean TRUE with non-boolean:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean TRUE with non-boolean:
    {}
---*)
