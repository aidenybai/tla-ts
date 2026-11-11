(*---
description: Evaluates a random bool expression, seed 262, number 1801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<1>>) * Head(<<1>>)) \in (({1} \cap {}) \ ({1} \cap {}))) \/ (~(\A b2853 \in (0 .. [a |-> 1]) : (0 = b2853)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01801 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
