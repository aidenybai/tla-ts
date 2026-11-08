(*---
description: Evaluates a random set expression, seed 262, number 9381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14556 \in UNION {DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = 1], {(2 \div {}) : b14557 \in UNION {{1, 2}, {2, 1, 3}}}} : ((({x \in 1..3 : x > 1} \subseteq {1}) => (TRUE => TRUE)) \/ (\E b14558 \in {2, 2147483647} : ([a |-> 1] = [a |-> 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09381 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
