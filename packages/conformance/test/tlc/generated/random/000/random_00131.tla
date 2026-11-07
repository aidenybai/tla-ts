(*---
description: Evaluates a random set expression, seed 262, number 131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \subseteq Nat) + (2 - 2147483647)) % (IF TRUE THEN [a |-> 1, b |-> TRUE] ELSE -1 + (7 % 0))) .. IF ({1, 2} \subseteq (0 * 3)) THEN CASE (3 = 1) -> (0 + 0) [] OTHER -> Len({x \in 1..3 : x > 1}) ELSE (([a |-> 1, b |-> TRUE]).a - (2 \div [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
