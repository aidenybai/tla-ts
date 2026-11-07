(*---
description: Evaluates a random int expression, seed 262, number 4692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7334 \in [(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Cardinality((<<3, 1, 2>> .. 3))] : (((1..3 = [a |-> 1, b |-> TRUE]) \/ (-1 = 3)) <=> (UNION {2..1, {2, 1, 3}} \subseteq (1 .. Nat)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
