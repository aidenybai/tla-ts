(*---
description: Evaluates a random function expression, seed 262, number 7788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((3 % TRUE) - Cardinality({1, 2}))) :> (IF (-1 \subseteq 1..3) THEN (0 * 0) ELSE [(1 :> 2) EXCEPT ![1] = [a |-> 1, b |-> TRUE]] % (([x \in Nat |-> x + 1] @@ (1 :> 2)))[(CHOOSE b12014 \in {x \in 1..3 : x > 1} : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07788 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
