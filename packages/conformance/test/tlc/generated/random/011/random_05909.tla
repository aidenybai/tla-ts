(*---
description: Evaluates a random set expression, seed 262, number 5909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[x \in 1..2 |-> x] EXCEPT ![TRUE] = b9117])[(FALSE * b9117)] : b9117 \in {(2 \div <<1>>), (3 + 0)}} \ (((-7) .. IF FALSE THEN -1 ELSE -1) \ [[a |-> 3, b |-> TRUE] EXCEPT !.a = (7 * 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05909 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
