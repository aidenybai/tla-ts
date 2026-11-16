(*---
description: Evaluates a random function expression, seed 262, number 8671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) @@ (CASE FALSE -> 7 [] OTHER -> 2 :> (-1 + -1))) EXCEPT ![(((TRUE .. 7) \div LET b13416 == 3 IN 0) - Cardinality({7 : b13417 \in SUBSET {1}}))] = (-Tail(Tail(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08671 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
