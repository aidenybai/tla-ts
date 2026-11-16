(*---
description: Evaluates a random set expression, seed 262, number 5950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-IF (FALSE <=> FALSE) THEN ((1 :> 2) + 2) ELSE Cardinality({2, 1, 3})) : b9172 \in (Cardinality({b9173 : b9173 \in 1..3}) - ([b9174 \in {1, 2} |-> b9174])[(-{1})])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05950 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
