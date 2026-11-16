(*---
description: Evaluates a random int expression, seed 262, number 8908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b13802 == (CHOOSE r \in [a : {1, 2}] : TRUE) IN IF FALSE THEN 7 ELSE b13802) - (((CHOOSE b13803 \in Nat : TRUE) % Head(<<1, 2>>)) \div Len(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08908 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
