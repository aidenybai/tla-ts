(*---
description: Evaluates a random seq expression, seed 262, number 1852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-LET b2924 == 2 IN [a |-> 1, b |-> TRUE]) + LET b2925 == (0 % -1) IN (b2925 - b2925)) \div (((2 * 1) :> (1 - 2)))[((CHOOSE b2926 \in Nat : TRUE) .. (3 \div 2))]))
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
