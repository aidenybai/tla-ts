(*---
description: Evaluates a random record expression, seed 262, number 8801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> -1, b |-> TRUE] EXCEPT !.a = SubSeq(<<1>>, 2147483647, -1)] EXCEPT !.a = (CASE FALSE -> {x \in 1..3 : x > 1} [] OTHER -> 7 - (-1 - 1))] EXCEPT !.a = (LET b13636 == (1 * 1) IN (b13636 \div 7) \div (Head(<<3, 1, 2>>) \div (CHOOSE b13637 \in SUBSET {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
