(*---
description: Evaluates a random function expression, seed 262, number 492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((FALSE :> 3) @@ [(1 :> 2) EXCEPT ![0] = 3]) EXCEPT ![IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (3 * 7) ELSE LET b811 == 1 IN -1] = ((3 * 1) * [[x \in 1..2 |-> x] EXCEPT ![1] = 2])] @@ (((1 - 3) * Cardinality(1..3)) :> (IF TRUE THEN 1 ELSE 0 - ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 42 of module random_00492
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    FALSE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
