(*---
description: Evaluates a random record expression, seed 262, number 4154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a, b |-> (({x \in 1..3 : x > 1} \cup SUBSET {1}) \subseteq {7 : b6540 \in {x \in 1..3 : x > 1}})] EXCEPT !.a = ((([a |-> 1]).a :> (3 - -1)))[((2147483647 + FALSE) \div (CHOOSE b6541 \in {1, 2} : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04154 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
