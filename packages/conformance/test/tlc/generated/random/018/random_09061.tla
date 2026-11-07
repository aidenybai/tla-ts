(*---
description: Evaluates a random function expression, seed 262, number 9061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14085 \in (((TRUE .. 1) \cup (0 < 2147483647)) \cup ((-1 - 7) .. CASE TRUE -> 0 [] OTHER -> 7)) |-> ([(b14085 :> 2) EXCEPT ![[<<>> EXCEPT ![1] = 7]] = Head(<<1, 2>>)])[(-CASE FALSE -> b14085 [] OTHER -> b14085)]])
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
