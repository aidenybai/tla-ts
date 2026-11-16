(*---
description: Evaluates a random function expression, seed 262, number 3502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (1 - 2147483647) ELSE (-2147483647) - Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) :> ([[a |-> 1, b |-> FALSE] EXCEPT !.a = CASE TRUE -> 0 [] OTHER -> 1] \div Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03502 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
