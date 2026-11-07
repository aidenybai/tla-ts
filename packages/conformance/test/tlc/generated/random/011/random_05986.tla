(*---
description: Evaluates a random function expression, seed 262, number 5986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Len(<<>>) :> (-1 * 7)) EXCEPT ![(([x \in 1..2 |-> x] @@ TRUE) = {1, -1})] = (-(CHOOSE b9224 \in SUBSET {1} : FALSE))] EXCEPT ![Len(SortSeq([<<>> EXCEPT ![1] = 7], LAMBDA p, q : p < q))] = ([b9225 \in (2 .. 0) |-> Cardinality({1})] - (CHOOSE b9226 \in ({2, 1, 3} \ {2, 1, 3}) : (FALSE => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
