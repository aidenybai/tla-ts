(*---
description: Evaluates a random set expression, seed 262, number 2894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((3 .. 2147483647) - (3 - 0)) :> ((-1 :> 1))[([a |-> 1, b |-> TRUE]).a]), (Cardinality(({2, 1, 3} \ [a |-> 1])) :> (IF FALSE THEN 2147483647 ELSE 3 \div Head(<<1>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02894 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
