(*---
description: Evaluates a random set expression, seed 262, number 8059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {([[a |-> 3, b |-> FALSE] EXCEPT !.a = Head(<<1>>)] \cup {LET b12450 == 2 IN b12450 : b12449 \in UNION {{x \in 1..3 : x > 1}, {2, 1, 3}}}), ((([a |-> 1]).a .. (2..1 \ {})) \ DOMAIN (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))})
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
