(*---
description: Evaluates a random function expression, seed 262, number 6703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10272 \in DOMAIN (([a |-> 1, b |-> TRUE] * 2) :> IF FALSE THEN 2 ELSE {1, 2}) |-> (-IF (1..3 = Nat) THEN LET b10273 == 2 IN 1 ELSE (CHOOSE b10274 \in {} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06703 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
