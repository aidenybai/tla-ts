(*---
description: Evaluates a random function expression, seed 262, number 2228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3502 \in (UNION {({1, 2} .. 7), {0 : b3503 \in 1..3}} \cap ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) \ ({} \cap 1..3))) |-> Head(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
