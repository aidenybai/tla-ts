(*---
description: Evaluates a random bool expression, seed 262, number 9466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14711 \in (((0 * FALSE) + Cardinality({x \in 1..3 : x > 1})) .. Cardinality(DOMAIN [x \in 1..2 |-> x])) : ([[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + Head(<<3, 1, 2>>)] \/ (\E b14712 \in ({1} \ 2..1) : (FALSE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
