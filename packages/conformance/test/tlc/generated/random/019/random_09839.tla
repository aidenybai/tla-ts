(*---
description: Evaluates a random int expression, seed 262, number 9839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b15277 \in UNION {([a |-> 1, b |-> TRUE] .. 7), {b15278 \in 2..1 : FALSE}} |-> IF (\E b15279 \in {2, 1, 3} : TRUE) THEN (b15277 % 3) ELSE Cardinality(Nat)])[(LET b15280 == (TRUE - 1) IN (2 \in Nat) - Cardinality({2, 7}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09839 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
