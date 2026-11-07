(*---
description: Evaluates a random set expression, seed 262, number 1341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((FALSE <=> TRUE) :> (3 - -1)))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a] : b2143 \in UNION {UNION {{1, 1}, DOMAIN [x \in Nat |-> x + 1]}, ((7 .. 3) \cap ({1, 2} .. -1))}})
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
