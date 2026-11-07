(*---
description: Evaluates a random record expression, seed 262, number 1306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = IF TRUE THEN 3 ELSE TRUE] EXCEPT !.a = @ + Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] EXCEPT !.a = @ + (CHOOSE b2071 \in {b2072 \in (2147483647 .. [a |-> 1]) : (<<1, 2>> = <<5, 6>>)} : (\E b2073 \in {b2074 : b2074 \in FALSE} : (Nat = SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
