(*---
description: Evaluates a random set expression, seed 262, number 4133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b6504 \in {b6503, 7} : (TRUE => TRUE)) % ((b6503 + 2) % LET b6505 == b6503 IN 2147483647)) : b6503 \in ({b6506 \in SortSeq(<<1, 2>>, LAMBDA p, q : p < q) : (\A b6507 \in {x \in 1..3 : x > 1} : FALSE)} \cap {(-[a |-> 1]), LET b6508 == 7 IN 2})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
