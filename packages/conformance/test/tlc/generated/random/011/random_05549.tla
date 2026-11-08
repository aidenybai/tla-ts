(*---
description: Evaluates a random int expression, seed 262, number 5549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2 + [x \in Nat |-> x + 1]) \subseteq DOMAIN (1 :> 2)) => ((-1 < 2) /\ (Nat \subseteq TRUE))) -> (CHOOSE b8584 \in ({1, 7} \ (0 .. -1)) : ([[a |-> 1] EXCEPT !.a = @ + 1] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))) [] OTHER -> Cardinality(((1 + 2) .. Cardinality(1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05549 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
