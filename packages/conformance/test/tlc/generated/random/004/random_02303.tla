(*---
description: Evaluates a random function expression, seed 262, number 2303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF ({x \in 1..3 : x > 1} = {}) THEN Len(<<3, 1, 2>>) ELSE LET b3638 == 7 IN SUBSET {1}) :> Cardinality((DOMAIN (1 :> 2) \cap (SUBSET {1} \ 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
---*)
