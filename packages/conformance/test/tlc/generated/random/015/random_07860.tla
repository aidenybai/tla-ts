(*---
description: Evaluates a random function expression, seed 262, number 7860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12137 \in DOMAIN [b12138 \in (3 .. FALSE) |-> LET b12139 == 1 IN b12138] |-> LET b12140 == Head((<<>> \o <<>>)) IN (Cardinality(SUBSET {1}) * Len(<<1>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07860 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
