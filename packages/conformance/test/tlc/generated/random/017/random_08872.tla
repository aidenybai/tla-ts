(*---
description: Evaluates a random int expression, seed 262, number 8872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + (CHOOSE b13740 \in {2, 1, 3} : TRUE)]).a - (((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) @@ [[x \in Nat |-> x + 1] EXCEPT ![-1] = -1]))[(CHOOSE b13741 \in (Nat \cap {x \in 1..3 : x > 1}) : ([a |-> 1] \in 2..1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 166 to line 14, col 186 of module random_08872
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
