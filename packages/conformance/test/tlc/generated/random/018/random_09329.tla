(*---
description: Evaluates a random record expression, seed 262, number 9329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((-LET b14470 == -1 IN <<1>>) + (([a |-> 1, b |-> TRUE]).a % (1 \div 7))), b |-> (Cardinality(UNION {{x \in 1..3 : x > 1}, Nat}) \in ({b14471 \in {2, 1, 3} : FALSE} \cap (1 .. 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09329 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
