(*---
description: Evaluates a random bool expression, seed 262, number 5350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Append(Tail(<<1>>), ({x \in 1..3 : x > 1} - 1)) = ((CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) @@ [[x \in 1..2 |-> x] EXCEPT ![0] = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05350 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
