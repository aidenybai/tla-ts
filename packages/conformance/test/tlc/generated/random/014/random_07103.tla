(*---
description: Evaluates a random int expression, seed 262, number 7103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2))[1] % ([x \in 1..2 |-> x])[1]) % ((<<>> * 1) - Head(<<>>))) + SelectSeq(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07103 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
