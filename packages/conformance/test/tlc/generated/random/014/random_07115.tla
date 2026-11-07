(*---
description: Evaluates a random function expression, seed 262, number 7115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10927 \in {({2, 1, 3} * 7), (0 \div 2)} : ([a |-> -1, b |-> TRUE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = b10927])) :> (CHOOSE b10928 \in UNION {(2..1 \ SUBSET {1}), ({} \cup 2..1)} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] = [a |-> b10928, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
