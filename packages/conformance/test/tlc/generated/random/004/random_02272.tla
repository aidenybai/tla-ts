(*---
description: Evaluates a random function expression, seed 262, number 2272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3585 \in {Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), (CHOOSE b3586 \in (1 .. 1) : (FALSE \/ SUBSET {1}))} : ([a |-> [<<1>> EXCEPT ![1] = -1], b |-> (TRUE => FALSE)] @@ (([x \in 1..2 |-> x])[b3585] :> Cardinality({2, 1, 3})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02272 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a set of the form SUBSET S.
    line 14, col 105 to line 14, col 123 of module random_02272
---*)
