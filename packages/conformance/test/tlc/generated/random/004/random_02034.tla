(*---
description: Evaluates a random function expression, seed 262, number 2034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3230 \in DOMAIN ((<<3, 1, 2>> - 1) :> IF FALSE THEN 7 ELSE 7) |-> Cardinality(({b3231 \in {} : TRUE} \cup (b3230 .. FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02034 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
