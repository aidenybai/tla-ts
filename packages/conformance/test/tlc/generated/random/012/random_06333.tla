(*---
description: Evaluates a random function expression, seed 262, number 6333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9732 \in {b9733 \in UNION {{b9734 \in Nat : FALSE}, (0 .. <<5, 6>>)} : (({1, 2} = {1}) <=> (<<>> = [x \in Nat |-> x + 1]))} |-> ((LET b9735 == b9732 IN 2147483647 - (7 - b9732)) - (Cardinality([x \in Nat |-> x + 1]) - ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06333 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
