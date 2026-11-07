(*---
description: Evaluates a random function expression, seed 262, number 1594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (FALSE \/ FALSE)) THEN (-CASE FALSE -> 2 [] OTHER -> [a |-> 1, b |-> TRUE]) ELSE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a, b |-> ((([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) => (\E b2547 \in {1, 2} : TRUE)) => (UNION {{}, SUBSET {1}} = (Nat \ {x \in 1..3 : x > 1})))])
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
