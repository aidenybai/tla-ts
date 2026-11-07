(*---
description: Evaluates a random function expression, seed 262, number 5454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8445 \in (<<CASE TRUE -> 7 [] OTHER -> 1, ([a |-> 1, b |-> TRUE] * <<1, 2>>)>> .. Len(<<[a |-> 1], -1>>)) |-> ((-(3 - b8445)) % Head(Tail(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
