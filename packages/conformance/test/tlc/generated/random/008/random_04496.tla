(*---
description: Evaluates a random seq expression, seed 262, number 4496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq([(<<1, 2>> \o <<3, 1, 2>>) EXCEPT ![1] = (7 - 0)], (Append(<<1>>, -1) + Len(<<>>)), (((1 :> 2))[2] % Head(<<1, 2>>))), ((Cardinality({1, 2}) - (2147483647 - 2147483647)) \div (-(-3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04496 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
