(*---
description: Evaluates a random seq expression, seed 262, number 3730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SortSeq([<<>> EXCEPT ![1] = 3], LAMBDA p, q : p < q), CASE (\E b5890 \in 1..3 : FALSE) -> ([x \in 1..2 |-> x])[0] [] OTHER -> ((1 :> 2) \div 3), ((7 % 3) \div Len(<<>>))), Len([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = IF [x \in Nat |-> x + 1] THEN -1 ELSE 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_03730
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
