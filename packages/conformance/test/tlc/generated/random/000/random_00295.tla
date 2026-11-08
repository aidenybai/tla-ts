(*---
description: Evaluates a random seq expression, seed 262, number 295.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00295 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b490 \in {IF (TRUE => TRUE) THEN (b491 + <<1, 2>>) ELSE (b491 + b491) : b491 \in {([a |-> 1]).a, ([a |-> 1]).a}} : (~(\A b492 \in (1..3 \cap 2..1) : (TRUE => FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00295 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
