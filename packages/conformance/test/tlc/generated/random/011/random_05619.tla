(*---
description: Evaluates a random int expression, seed 262, number 5619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) -> (Head(<<3, 1, 2>>) * (2147483647 - 0)) [] OTHER -> (-(CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE)) * (Cardinality({0, -1}) % ([[x \in 1..2 |-> x] EXCEPT ![3] = 2])[CASE FALSE -> <<3, 1, 2>> [] OTHER -> 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05619 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
