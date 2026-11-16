(*---
description: Evaluates a random int expression, seed 262, number 5292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([[a |-> 1] EXCEPT !.a = @ + 7] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)) THEN Cardinality({b8197 : b8197 \in 1..3}) ELSE (-([a |-> 1]).a) * (((7 + <<1, 2>>) \div Head(<<1>>)) + Head(<<7, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05292 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
