(*---
description: Evaluates a random function expression, seed 262, number 9776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (0 % 2), b |-> (TRUE \/ FALSE)]).a :> LET b15176 == CASE (\A b15177 \in {x \in 1..3 : x > 1} : TRUE) -> ([x \in 1..2 |-> x])[7] [] OTHER -> (2 % 3) IN (-(-(1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09776 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
