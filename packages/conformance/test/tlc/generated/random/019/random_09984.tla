(*---
description: Evaluates a random set expression, seed 262, number 9984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) + (-1 + 3)) .. ((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[((1 :> 2))[1]]) \ (((1 - 7) % (CHOOSE b15522 \in 2..1 : TRUE)) .. CASE (CHOOSE r \in [a : {1, 2}] : TRUE) -> (3 \div 2) [] OTHER -> (0 % 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
