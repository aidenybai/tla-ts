(*---
description: Evaluates a random set expression, seed 262, number 8885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a * [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + Len(<<1>>)]) .. Cardinality(({3 : b13763 \in {2, 1, 3}} \ {b13764 \in 2..1 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08885 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
