(*---
description: Evaluates a random record expression, seed 262, number 1854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE (TRUE /\ FALSE) -> (-1) [] OTHER -> [a |-> 1, b |-> FALSE] \div CASE (TRUE \/ FALSE) -> Cardinality(1..3) [] OTHER -> Head(<<1, 2>>)), b |-> (((Nat \cap 1..3) \subseteq UNION {FALSE, {2, 1, 3}}) <=> (\E b2928 \in UNION {<<5, 6>>, 2..1} : (FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
