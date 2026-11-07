(*---
description: Evaluates a random bool expression, seed 262, number 9221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(<<3, 2>>, LAMBDA e : e > 0) = (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE)) \/ (DOMAIN (CHOOSE f \in [{} -> {1, 2}] : TRUE) = {CASE FALSE -> b14311 [] OTHER -> 0 : b14311 \in (1 .. [a |-> 1])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
