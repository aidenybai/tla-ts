(*---
description: Evaluates a random record expression, seed 262, number 7046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b10808 == (LET b10809 == [a |-> 1, b |-> TRUE] IN 2 \div ([a |-> 1]).a) IN (([a |-> 1, b |-> TRUE] % b10808) + ([x \in 1..2 |-> x])[TRUE]), b |-> (((-1 \div 7) * (-<<3, 1, 2>>)) < ((3 % 2) + Cardinality({1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07046 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
