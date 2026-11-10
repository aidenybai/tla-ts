(*---
description: Evaluates a random bool expression, seed 262, number 1793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b2845 \in SUBSET {1} : FALSE}, {b2846 \in Nat : FALSE}} \cup (({1, 2} \cup 1..3) \ DOMAIN [x \in Nat |-> x + 1])) \subseteq (UNION {(Nat \cup 1..3), (0 .. -1)} .. (Head(<<1>>) + (FALSE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01793 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
