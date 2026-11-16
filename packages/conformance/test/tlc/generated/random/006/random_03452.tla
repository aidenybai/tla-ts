(*---
description: Evaluates a random bool expression, seed 262, number 3452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2}] : TRUE) = [[[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = (0 * 2147483647)] EXCEPT !.a = @ + CASE (\A b5472 \in {} : TRUE) -> ([a |-> 1, b |-> TRUE] + -1) [] OTHER -> (2 - 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03452 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
