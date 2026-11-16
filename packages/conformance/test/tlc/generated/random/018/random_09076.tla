(*---
description: Evaluates a random int expression, seed 262, number 9076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<1>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = (0 % 2147483647)] - Len(<<2147483647, 0>>)) + (CHOOSE b14100 \in Head((<<1>> \o <<3, 1, 2>>)) : (Cardinality({2, 1, 3}) < SortSeq([x \in 1..2 |-> x], LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09076 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
