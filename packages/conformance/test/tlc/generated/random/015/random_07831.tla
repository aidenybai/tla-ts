(*---
description: Evaluates a random int expression, seed 262, number 7831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({([a |-> 1]).a, Len(<<1, 2>>)}) + IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + <<3, 1, 2>>]) THEN Cardinality(DOMAIN [x \in Nat |-> x + 1]) ELSE ((Nat @@ <<5, 6>>))[Cardinality(1..3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07831 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
