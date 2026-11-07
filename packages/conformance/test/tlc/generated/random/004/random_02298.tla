(*---
description: Evaluates a random bool expression, seed 262, number 2298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (~(TRUE <=> TRUE)) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1])[([x \in 1..2 |-> x] * 1)] ELSE (Cardinality({1}) % [[x \in Nat |-> x + 1] EXCEPT ![1] = {x \in 1..3 : x > 1}]), b |-> (({1 : b3631 \in {2, 1, 3}} = ([a |-> 1, b |-> TRUE] \cap SUBSET {1})) <=> ((FALSE => TRUE) <=> (1 \in {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
