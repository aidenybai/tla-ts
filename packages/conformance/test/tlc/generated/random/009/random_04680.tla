(*---
description: Evaluates a random bool expression, seed 262, number 4680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<([a |-> 1, b |-> TRUE]).a, ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])>> EXCEPT ![1] = IF <<-1, {x \in 1..3 : x > 1}>> THEN LET b7316 == 3 IN 3 ELSE Cardinality({x \in 1..3 : x > 1})] = ([(2147483647 :> 1) EXCEPT ![(3 + -1)] = Len(<<3, 1, 2>>)] @@ (([a |-> 1, b |-> TRUE]).a :> IF TRUE THEN 3 ELSE 0))))
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
