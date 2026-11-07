(*---
description: Evaluates a random set expression, seed 262, number 1419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2262 \in UNION {(([a |-> 1, b |-> TRUE] \div 1) - (-1 + 2)), DOMAIN [<<5, 6>> EXCEPT ![-1] = 2147483647]} : (LET b2263 == LET b2264 == b2262 IN b2264 IN Cardinality(1..3) = Head(SelectSeq(<<>>, LAMBDA e : e > 0)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
