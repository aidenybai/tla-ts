(*---
description: Evaluates a random int expression, seed 262, number 1609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b2568 == (-(2147483647 + <<1, 2>>)) IN [b2569 \in ({1} \cap {x \in 1..3 : x > 1}) |-> Head(<<>>)] * ((-IF FALSE THEN -1 ELSE <<1, 2>>) \div CASE (~FALSE) -> (-2147483647) [] OTHER -> {b2570 \in 1..3 : [x \in Nat |-> x + 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
