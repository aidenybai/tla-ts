(*---
description: Evaluates a random function expression, seed 262, number 6454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9933 \in {Cardinality({2, 1, 3}), (0 * 2147483647)} |-> ((CHOOSE f \in [2..1 -> {1}] : TRUE) - (-2))] EXCEPT ![(-((2 * 1) % (2147483647 % 2)))] = Cardinality(([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 3] @@ (2147483647 :> -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06454 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
