(*---
description: Evaluates a random bool expression, seed 262, number 746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({[[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (-<<3, 1, 2>>)], CASE (FALSE /\ TRUE) -> LET b1225 == 2147483647 IN FALSE [] OTHER -> (3 % 0)} \subseteq DOMAIN [b1226 \in DOMAIN [x \in 1..2 |-> x] |-> (CHOOSE r \in [a : 1..2] : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00746 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
