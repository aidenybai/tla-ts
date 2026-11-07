(*---
description: Evaluates a random set expression, seed 262, number 6040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-(Head(<<3, 1, 2>>) * LET b9304 == b9303 IN 7)) : b9303 \in ((({1, 2} \ {1, 2}) \cup UNION {{}, 2..1}) \ (DOMAIN [x \in Nat |-> x + 1] \ (TRUE .. 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
