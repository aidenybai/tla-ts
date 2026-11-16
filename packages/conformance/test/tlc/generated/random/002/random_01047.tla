(*---
description: Evaluates a random bool expression, seed 262, number 1047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) = IF (({} \cup {1}) = UNION {{1}, 1..3}) THEN (CHOOSE b1683 \in (1..3 \cup {2, 1, 3}) : (<<1, 2>> = <<5, 6>>)) ELSE (([a |-> 1]).a - [b1684 \in SUBSET {1} |-> b1684])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01047 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
