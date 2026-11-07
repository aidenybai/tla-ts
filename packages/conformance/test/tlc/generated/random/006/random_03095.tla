(*---
description: Evaluates a random record expression, seed 262, number 3095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({0 : b4936 \in {2, 1, 3}}), b |-> (\A b4937 \in {2147483647, 2147483647} : (b4937 < 0))] EXCEPT !.a = CASE (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) /\ (1 = 2)) -> (Head(<<1, 2>>) % ([a |-> 1]).a) [] OTHER -> ((<<1, 2>> + 2) + (CHOOSE b4938 \in SUBSET {1} : FALSE))])
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
