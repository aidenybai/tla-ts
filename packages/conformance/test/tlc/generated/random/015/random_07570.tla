(*---
description: Evaluates a random function expression, seed 262, number 7570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF (FALSE /\ TRUE) THEN (3 % 1) ELSE ([a |-> 1]).a) :> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] + (0 + {1})) + ((2147483647 % 2) \div (CHOOSE b11652 \in 1..3 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07570 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
