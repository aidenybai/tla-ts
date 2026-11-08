(*---
description: Evaluates a random seq expression, seed 262, number 402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq([a |-> (7 + [x \in 1..2 |-> x]), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])], Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), IF (\A b658 \in {x \in 1..3 : x > 1} : TRUE) THEN (2 % 1) ELSE LET b659 == 0 IN 1) EXCEPT ![1] = (((<<3, 1, 2>> * 3) - ([a |-> 1]).a) + Cardinality({<<1, 2>> : b660 \in {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00402 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
