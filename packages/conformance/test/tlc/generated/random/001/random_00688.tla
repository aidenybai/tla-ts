(*---
description: Evaluates a random record expression, seed 262, number 688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] * IF FALSE THEN 7 ELSE 2)), b |-> ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00688 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
