(*---
description: Evaluates a random record expression, seed 262, number 513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = ((7 - 7) % LET b859 == 1 IN b859)] EXCEPT !.a = (Cardinality({b860 \in {x \in 1..3 : x > 1} : [a |-> 1, b |-> TRUE]}) + (CHOOSE b861 \in (2147483647 .. 2147483647) : (FALSE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00513 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 187 to line 14, col 207 of module random_00513
---*)
