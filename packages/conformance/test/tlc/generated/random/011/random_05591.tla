(*---
description: Evaluates a random function expression, seed 262, number 5591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8658 \in UNION {({-1, 1} \ (0 .. 1)), (IF TRUE THEN -1 ELSE 2147483647 .. CASE TRUE -> 1 [] OTHER -> 2)} |-> IF ({b8658, b8658} = (1..3 \cup {x \in 1..3 : x > 1})) THEN IF ([x \in 1..2 |-> x] @@ (1 :> 2)) THEN LET b8659 == 0 IN 1 ELSE (b8658 % 7) ELSE LET b8660 == (3 % 7) IN Cardinality(SUBSET {1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    {-1}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    {-1}
---*)
