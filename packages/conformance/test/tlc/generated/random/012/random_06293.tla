(*---
description: Evaluates a random function expression, seed 262, number 6293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([a |-> [x \in Nat |-> x + 1], b |-> FALSE]).a) :> (CHOOSE b9676 \in {(<<5, 6>>)[b9677] : b9677 \in ({1} \ {1})} : (IF TRUE THEN 1 ELSE b9676 = (b9676 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
