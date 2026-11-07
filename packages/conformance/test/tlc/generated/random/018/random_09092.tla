(*---
description: Evaluates a random record expression, seed 262, number 9092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((-7) - CASE TRUE -> 1 [] OTHER -> 1) + CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Len(<<>>) [] OTHER -> (7 \div 7)), b |-> (\E b14125 \in {(TRUE * b14126) : b14126 \in {1 : b14127 \in 1..3}} : ([[a |-> 1] EXCEPT !.a = @ + b14125] = [[a |-> 1] EXCEPT !.a = @ + b14125]))])
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
