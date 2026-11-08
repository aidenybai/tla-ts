(*---
description: Evaluates a random bool expression, seed 262, number 4717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + [x \in Nat |-> x + 1]) :> (0 * 2147483647)) \cup ((<<5, 6>> \cap 1..3) \cap UNION {{2, 1, 3}, 2..1})) \subseteq ({([a |-> 1, b |-> TRUE]).a, LET b7378 == 2147483647 IN b7378} \cap ((2147483647 - 2147483647) .. (1 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04717 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
