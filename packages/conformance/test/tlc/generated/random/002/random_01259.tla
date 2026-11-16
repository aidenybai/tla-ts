(*---
description: Evaluates a random function expression, seed 262, number 1259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![(2147483647 * 7)] = ([a |-> 1] + 7)] @@ [(CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![CASE TRUE -> 1 [] OTHER -> 0] = (CHOOSE b2010 \in TRUE : TRUE)]) @@ (CHOOSE f \in [{1} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01259 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
