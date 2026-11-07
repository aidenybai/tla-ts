(*---
description: Evaluates a random record expression, seed 262, number 6383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + LET b9814 == 1 IN b9814] EXCEPT !.a = @ + Head(<<<<>>, 1>>)] EXCEPT !.a = (CHOOSE b9815 \in [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + IF TRUE THEN -1 ELSE 2147483647] : (({x \in 1..3 : x > 1} = {1}) => (\A b9816 \in {2, 1, 3} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
