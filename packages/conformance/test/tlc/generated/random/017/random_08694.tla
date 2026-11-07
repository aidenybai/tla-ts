(*---
description: Evaluates a random bool expression, seed 262, number 8694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13458 \in ((1..3 \ 1..3) \cup {7, 1}) : (\E b13459 \in DOMAIN [x \in 1..2 |-> x] : (TRUE /\ TRUE))) = Append([[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + LET b13460 == 2147483647 IN <<1, 2>>], CASE (~TRUE) -> (-1) [] OTHER -> (1 % 2147483647))))
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
