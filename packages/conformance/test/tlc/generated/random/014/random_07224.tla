(*---
description: Evaluates a random set expression, seed 262, number 7224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((7 * 3) - (-3)), IF (7 < 2) THEN (7 % 2) ELSE (7 * [x \in Nat |-> x + 1])} \cap ((UNION {2..1, 1..3} \cup ({1, 2} \cup Nat)) \cup (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07224 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
