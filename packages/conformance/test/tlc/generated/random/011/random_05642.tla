(*---
description: Evaluates a random function expression, seed 262, number 5642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8716 \in UNION {(([x \in Nat |-> x + 1] @@ (1 :> 2)) \cap {TRUE : b8717 \in Nat}), {b8718 \in {-1, 1} : (<<1>> = (1 :> 2))}} |-> ([a |-> IF FALSE THEN b8716 ELSE b8716, b |-> (b8716 < 3)]).a])
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
