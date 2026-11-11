(*---
description: Evaluates a random bool expression, seed 262, number 7587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b11674 \in DOMAIN [b11675 \in {x \in 1..3 : x > 1} |-> b11675] : ((3 \in 2..1) <=> ({x \in 1..3 : x > 1} = 2..1))) <=> (((3 + 2) .. ([x \in Nat |-> x + 1] - -1)) = ((CHOOSE b11676 \in SUBSET {1} : FALSE) .. ([x \in 1..2 |-> x])[0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07587 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
