(*---
description: Evaluates a random int expression, seed 262, number 1246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1995 == Head(<<1>>) IN ((1 :> 2))[b1995] :> (([x \in 1..2 |-> x])[2] + ([x \in Nat |-> x + 1])[2])) % LET b1996 == [[<<3, 1, 2>> EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + Cardinality(-1)] IN Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01246 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
