(*---
description: Evaluates a random function expression, seed 262, number 7462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11500 \in (SortSeq(<<1>>, LAMBDA p, q : p < q) \ UNION {1..3, {1, 2}}) |-> ((-<<>>) + ([x \in Nat |-> x + 1])[b11500])] :> LET b11501 == ((CHOOSE b11502 \in (1 :> 2) : TRUE) - Head(<<3, 1, 2>>)) IN ((CHOOSE r \in [a : {1, 2}] : TRUE) + Len(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07462 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
