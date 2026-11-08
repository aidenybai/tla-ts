(*---
description: Evaluates a random function expression, seed 262, number 1976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3130 \in DOMAIN (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) |-> LET b3131 == ((~<<5, 6>>) - Head(<<3, 1, 2>>)) IN (LET b3132 == b3130 IN b3130 \div ({1} = {}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01976 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
