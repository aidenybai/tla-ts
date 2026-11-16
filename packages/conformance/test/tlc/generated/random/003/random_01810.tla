(*---
description: Evaluates a random set expression, seed 262, number 1810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (({2, 1, 3} \cup {1, 2}) \subseteq {b2861 \in 2..1 : <<3, 1, 2>>}) -> Cardinality({-1 : b2862 \in <<5, 6>>}) [] OTHER -> ((CHOOSE f \in [1..2 -> {1}] : TRUE) @@ [(1 :> 2) EXCEPT ![2] = 3]) .. Cardinality({LET b2864 == 2 IN b2863 : b2863 \in {FALSE : b2865 \in {1, 2}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 185 to line 14, col 190 of module random_01810
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01810 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
