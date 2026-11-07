(*---
description: Evaluates a random int expression, seed 262, number 4651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7277 \in ((LET b7278 == (1 :> 2) IN b7278 - [[x \in Nat |-> x + 1] EXCEPT ![3] = 2147483647]) .. (CASE [a |-> 1] -> 3 [] OTHER -> <<1>> + ((1 :> 2))[-1])) : ((-Head(<<3, 1, 2>>)) \in DOMAIN (<<5, 6>> @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
