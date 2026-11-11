(*---
description: plus_left applied to set_map, a SetEnumValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_left_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} + 1)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module plus_left_set_map failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
