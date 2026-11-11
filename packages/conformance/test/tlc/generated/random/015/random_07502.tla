(*---
description: Evaluates a random bool expression, seed 262, number 7502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b11558 \in ([x \in Nat |-> x + 1] @@ <<>>) : (\A b11559 \in SUBSET {1} : TRUE)) @@ [b11560 \in {{1}, -1} |-> (CHOOSE b11561 \in SUBSET {1} : FALSE)]) @@ (CHOOSE f \in [1..2 -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07502 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
