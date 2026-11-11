(*---
description: Evaluates a random int expression, seed 262, number 7237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11121 \in (Head(<<1>>) .. IF [a |-> 1, b |-> TRUE] THEN 0 ELSE 3) : ({b11122 : b11122 \in 1..3} \subseteq {b11123 \in {1, 2} : TRUE})) + LET b11124 == CASE (<<1>> = (1 :> 2)) -> (1 + 2147483647) [] OTHER -> Cardinality({}) IN ([[a |-> 1] EXCEPT !.a = [a |-> 1, b |-> TRUE]]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07237 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 52 to line 14, col 89 of module random_07237
---*)
