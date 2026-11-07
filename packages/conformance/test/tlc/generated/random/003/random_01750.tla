(*---
description: Evaluates a random seq expression, seed 262, number 1750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((-<<3, 1, 2>>) % (CHOOSE b2779 \in SUBSET {1} : TRUE)), ((0 % 1) % IF TRUE THEN 2147483647 ELSE 1)>> \o [[[0 EXCEPT ![1] = 1] EXCEPT ![1] = (CHOOSE b2780 \in Nat : FALSE)] EXCEPT ![1] = ([b2781 \in {} |-> b2781] @@ ((1 :> 2) @@ (1 :> 2)))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
