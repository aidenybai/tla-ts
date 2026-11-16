(*---
description: Evaluates a random function expression, seed 262, number 3665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a - Cardinality({x \in 1..3 : x > 1})) * (Cardinality({}) - UNION {Nat, {x \in 1..3 : x > 1}})) :> ((-IF FALSE THEN 7 ELSE -1) * LET b5791 == CASE FALSE -> 0 [] OTHER -> 1 IN (b5791 * <<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03665 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UnionValue to tlc2.value.impl.IntValue
---*)
