(*---
description: Evaluates a random int expression, seed 262, number 7431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-3) \div LET b11455 == 0 IN [a |-> 1]) - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a) - IF ((FALSE <=> TRUE) /\ (\A b11456 \in {1} : TRUE)) THEN LET b11457 == Head(<<3, 1, 2>>) IN Len(<<1>>) ELSE ((0 % 1) * (1 + -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
