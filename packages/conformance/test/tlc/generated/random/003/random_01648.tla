(*---
description: Evaluates a random set expression, seed 262, number 1648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({CASE FALSE -> b2635 [] OTHER -> 7 : b2635 \in {2147483647 : b2636 \in SUBSET {1}}}) :> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + FALSE] EXCEPT !.a = Len(<<3, 1, 2>>)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01648 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
