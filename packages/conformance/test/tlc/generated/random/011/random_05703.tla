(*---
description: Evaluates a random int expression, seed 262, number 5703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(SubSeq([<<1, 2>> EXCEPT ![1] = 0], (CHOOSE b8777 \in {1, 2} : TRUE), Len(<<1>>)) = ((1 :> 7) @@ (CHOOSE f \in [2..1 -> {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05703 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
