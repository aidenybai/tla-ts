(*---
description: Evaluates a random record expression, seed 262, number 300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (-[a |-> 1])] EXCEPT !.a = (LET b498 == 0 IN b498 - ([a |-> 1]).a)] EXCEPT !.a = IF (([a |-> 1]).a < ({x \in 1..3 : x > 1} \o <<1, 2>>)) THEN Cardinality(DOMAIN [x \in Nat |-> x + 1]) ELSE Len(Tail(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
