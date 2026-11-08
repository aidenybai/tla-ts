(*---
description: Evaluates a random bool expression, seed 262, number 2117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b3360 \in {b3361 \in [a |-> 1] : TRUE} |-> LET b3362 == b3360 IN b3360] .. (Cardinality({}) - Cardinality(1..3))) \subseteq DOMAIN ((3 + 2) :> Len(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02117 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
