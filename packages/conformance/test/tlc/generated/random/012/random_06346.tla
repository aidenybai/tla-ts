(*---
description: Evaluates a random seq expression, seed 262, number 6346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b9749 == Cardinality({x \in 1..3 : x > 1}) IN ([a |-> 1]).a + (-(3 % <<1, 2>>))) \o <<LET b9750 == ([x \in 1..2 |-> x])[1] IN (<<1, 2>>).a, Cardinality(({x \in 1..3 : x > 1} \cup 1..3))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06346 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
