(*---
description: Evaluates a random int expression, seed 262, number 569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({x \in 1..3 : x > 1}) * (0 - -1)) - IF ([a |-> 1] = [a |-> 1]) THEN <<2, 0>> ELSE (7 + FALSE)) % LET b966 == ([[a |-> 1] EXCEPT !.a = 1]).a IN (({2, 1, 3} + b966) % Head(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00569 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
