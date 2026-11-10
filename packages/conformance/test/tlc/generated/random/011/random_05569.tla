(*---
description: Evaluates a random function expression, seed 262, number 5569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Cardinality({1, 2}) % [<<3, 1, 2>> EXCEPT ![1] = 0]) :> ((-3) + (CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE))) EXCEPT ![Head(SortSeq(SortSeq([a |-> 1], LAMBDA p, q : p < q), LAMBDA p, q : p < q))] = (Head([<<1>> EXCEPT ![1] = 1]) + IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (2 + -1) ELSE (7 \div 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05569 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
