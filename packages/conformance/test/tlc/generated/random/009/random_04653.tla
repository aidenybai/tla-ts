(*---
description: Evaluates a random int expression, seed 262, number 4653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a < (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[[<<5, 6>> EXCEPT ![2] = 3]]) THEN (((CHOOSE b7279 \in 2..1 : TRUE) % Cardinality(1..3)) \div ((\E b7280 \in 2..1 : TRUE) => (CHOOSE f \in [1..2 -> {1}] : TRUE))) ELSE ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (-3)]).a)
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
