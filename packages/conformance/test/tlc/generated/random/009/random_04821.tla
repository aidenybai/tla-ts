(*---
description: Evaluates a random function expression, seed 262, number 4821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cap {}) \cup ({} \cap Nat)) \subseteq (({} \cap [x \in Nat |-> x + 1]) \cap ({x \in 1..3 : x > 1} \cup 2..1))) :> (Cardinality({b7522 : b7522 \in 1..3}) * (IF FALSE THEN -1 ELSE 2147483647 + [b7523 \in {} |-> 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04821 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
