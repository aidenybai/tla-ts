(*---
description: Evaluates a random set expression, seed 262, number 7864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT ![Cardinality(UNION {<<1, 2>>, Nat})] = (([x \in Nat |-> x + 1] @@ TRUE))[(CHOOSE b12146 \in {1} : TRUE)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07864 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    <<1, 2>>
---*)
