(*---
description: Evaluates a random set expression, seed 262, number 9679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((\E b15020 \in (2..1 \cap {2, 1, 3}) : ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})) * CASE (FALSE => TRUE) -> (1 - 0) [] OTHER -> Cardinality(1..3)), Cardinality(((2..1 \cup {}) \cap ({1, 2} \ {x \in 1..3 : x > 1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09679 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
