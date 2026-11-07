(*---
description: Evaluates a random function expression, seed 262, number 7998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12345 \in UNION {1..3, {1, 2}} |-> (-1)] \div IF ({2, 1, 3} \subseteq Nat) THEN Cardinality(SUBSET {1}) ELSE (-2147483647)) :> (CHOOSE b12346 \in ({-1 : b12347 \in {x \in 1..3 : x > 1}} \cup DOMAIN [x \in Nat |-> x + 1]) : <<(1 \div 2), LET b12348 == b12346 IN 7>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
