(*---
description: Evaluates a random int expression, seed 262, number 7284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2}] : TRUE)).a * IF (~TRUE) THEN ({1, 2} \div 7) ELSE (TRUE \/ FALSE)) - (CHOOSE b11217 \in {CASE FALSE -> 0 [] OTHER -> 3, (2147483647 \div 2)} : ([a |-> b11217, b |-> FALSE] = [[x \in 1..2 |-> x] EXCEPT ![2147483647] = b11217]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
