(*---
description: Evaluates a random int expression, seed 262, number 9894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b15384 == ([b15385 \in 2..1 |-> b15385])[(2147483647 - 1)] IN Cardinality({b15386 \in {1, 2} : FALSE}) % (CHOOSE b15387 \in {LET b15388 == {1, 2} IN b15388, (-[x \in Nat |-> x + 1])} : (\A b15389 \in ({2, 1, 3} \ SUBSET {1}) : UNION {Nat, 1..3}))))
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
