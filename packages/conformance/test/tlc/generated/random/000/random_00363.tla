(*---
description: Evaluates a random bool expression, seed 262, number 363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b597 \in {2147483647, 1} |-> (2 % b597)])[({b598 \in TRUE : TRUE} * (7 \div 7))] = CASE ([[a |-> 1] EXCEPT !.a = 3] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) -> IF {b599 \in {1, 2} : FALSE} THEN ([x \in Nat |-> x + 1])[3] ELSE (-0) [] OTHER -> (-LET b600 == 3 IN b600)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00363 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetPredValue to tlc2.value.impl.IntValue
---*)
