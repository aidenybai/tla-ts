(*---
description: Evaluates a random int expression, seed 262, number 8733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13525 == Head([[-1 EXCEPT ![1] = 2147483647] EXCEPT ![1] = (2 * 0)]) IN (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a - ([[a |-> 1, b |-> TRUE] EXCEPT !.a = <<5, 6>>]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08733 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
