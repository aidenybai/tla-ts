(*---
description: Evaluates a random int expression, seed 262, number 7381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((\E b11366 \in 1..3 : TRUE) \cup ({1, 2} \ 2..1)) \div LET b11367 == LET b11368 == 7 IN 7 IN (b11367 + 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
---*)
