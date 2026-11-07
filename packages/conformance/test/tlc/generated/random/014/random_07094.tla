(*---
description: Evaluates a random bool expression, seed 262, number 7094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE TRUE -> 3 [] OTHER -> -1, ([x \in Nat |-> x + 1])[0]} \ (([a |-> 1, b |-> TRUE] .. 2147483647) \cap ({} \cup {2, 1, 3}))) = (({b10894 \in {1, 2} : FALSE} \cap {TRUE, 3}) \cup ((2..1 \cup {x \in 1..3 : x > 1}) \cup DOMAIN [x \in Nat |-> x + 1]))))
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
