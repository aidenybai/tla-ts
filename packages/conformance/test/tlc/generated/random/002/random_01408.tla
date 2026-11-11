(*---
description: Evaluates a random function expression, seed 262, number 1408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2239 \in (({} \cup {1}) \cup DOMAIN <<5, 6>>) |-> (-(0 * 7))] EXCEPT ![((-(Nat \cap 1..3)) - (CHOOSE b2240 \in (2 .. 7) : (<<>> = <<5, 6>>)))] = (((3 :> 7) @@ (CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE)))[((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01408 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
