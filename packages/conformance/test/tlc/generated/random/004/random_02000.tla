(*---
description: Evaluates a random bool expression, seed 262, number 2000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b3167 \in Nat |-> 2147483647] @@ (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)) = (CASE FALSE -> 1 [] OTHER -> 2147483647 = CASE TRUE -> 7 [] OTHER -> 2147483647)) /\ (SelectSeq(Append(<<>>, [a |-> 1]), LAMBDA e : e > 0) = [a |-> Head(<<1>>), b |-> (TRUE /\ FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02000 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
