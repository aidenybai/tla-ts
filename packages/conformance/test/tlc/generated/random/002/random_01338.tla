(*---
description: Evaluates a random bool expression, seed 262, number 1338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((TRUE <=> FALSE) % CASE FALSE -> 2 [] OTHER -> 2), IF (<<1, 2>> = (1 :> 2)) THEN LET b2139 == 7 IN 0 ELSE Cardinality(2..1)} \ {b2140 \in {(-b2141) : b2141 \in {7, [a |-> 1, b |-> TRUE]}} : (~([a |-> 1, b |-> TRUE] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01338 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
