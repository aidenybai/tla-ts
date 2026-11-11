(*---
description: Evaluates a random int expression, seed 262, number 7480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b11524 \in Nat : FALSE} - (1 % 2147483647)) + (-(-1 \div 2))) + Cardinality({(2147483647 % 3) : b11525 \in {b11526 \in {x \in 1..3 : x > 1} : b11526}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07480 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetPredValue to tlc2.value.impl.IntValue
---*)
