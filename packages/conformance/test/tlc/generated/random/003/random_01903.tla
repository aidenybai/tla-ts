(*---
description: Evaluates a random set expression, seed 262, number 1903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (-<<5, 6>>), b |-> (3 < -1)] EXCEPT !.a = @ + IF (TRUE => FALSE) THEN (CHOOSE b2985 \in {1} : FALSE) ELSE LET b2986 == 7 IN 2147483647] \cap {((0 :> 2147483647))[IF FALSE THEN -1 ELSE b2987] : b2987 \in ({3, 2147483647} \cup {7 : b2988 \in {x \in 1..3 : x > 1}})}))
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
