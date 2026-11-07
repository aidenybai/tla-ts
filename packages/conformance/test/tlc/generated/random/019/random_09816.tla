(*---
description: Evaluates a random record expression, seed 262, number 9816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE b15241 \in {x \in 1..3 : x > 1} : TRUE) \div LET b15242 == 2..1 IN b15242), b |-> (({2, 1, 3} \cap {x \in 1..3 : x > 1}) = (Nat \cap {1, 2}))] EXCEPT !.a = ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (-3)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
