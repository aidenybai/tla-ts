(*---
description: Evaluates a random set expression, seed 262, number 3833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(1..3)] .. Len([<<1>> EXCEPT ![1] = 2147483647])) \ Len(<<([a |-> 1]).a, Cardinality({1})>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03833 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
