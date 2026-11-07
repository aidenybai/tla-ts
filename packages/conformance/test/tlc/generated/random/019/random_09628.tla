(*---
description: Evaluates a random bool expression, seed 262, number 9628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((TRUE => FALSE) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1])) .. (IF FALSE THEN 1 ELSE 0 * CASE TRUE -> 0 [] OTHER -> -1)) \subseteq ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + IF TRUE THEN 1 ELSE 1] \ ((-1 .. 1) \ (Nat \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
