(*---
description: Evaluates a random bool expression, seed 262, number 3823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SortSeq(<<1>>, LAMBDA p, q : p < q) .. LET b6023 == -1 IN b6023) \cup ({b6024 : b6024 \in {1, 2}} \cup (SUBSET {1} \ [a |-> 1, b |-> TRUE]))) = ({(\A b6026 \in {1} : FALSE) : b6025 \in ({x \in 1..3 : x > 1} \ Nat)} \cap ({b6027 \in {x \in 1..3 : x > 1} : FALSE} \ {b6028 \in {x \in 1..3 : x > 1} : [x \in 1..2 |-> x]}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03823 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
