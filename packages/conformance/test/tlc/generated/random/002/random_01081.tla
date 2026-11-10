(*---
description: Evaluates a random bool expression, seed 262, number 1081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-{2, 1, 3}) .. IF [a |-> 1, b |-> TRUE] THEN 1 ELSE 2147483647) = (((1 :> 2))[1] :> Cardinality(2..1))) <=> (([<<1>> EXCEPT !.a = @ + 1] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) /\ (~[<<5, 6>> EXCEPT ![7] = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01081 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
