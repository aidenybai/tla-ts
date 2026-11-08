(*---
description: Evaluates a random int expression, seed 262, number 6225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9578 \in (((7 - <<3, 1, 2>>)).a .. (([a |-> 1]).a - [[x \in 1..2 |-> x] EXCEPT ![-1] = 1])) : (IF [[a |-> 1] EXCEPT !.a = @ + b9578] THEN (0 - b9578) ELSE (3 * b9578) \in (({1} \cap {2, 1, 3}) \ DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06225 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
