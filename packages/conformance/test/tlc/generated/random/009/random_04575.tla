(*---
description: Evaluates a random int expression, seed 262, number 4575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 * 3) :> Cardinality({1, 2})) @@ ((2147483647 - 3) :> (-1 - SUBSET {1}))))[(Cardinality({b7178 \in {x \in 1..3 : x > 1} : FALSE}) % Cardinality(UNION {{1}, {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04575 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
---*)
