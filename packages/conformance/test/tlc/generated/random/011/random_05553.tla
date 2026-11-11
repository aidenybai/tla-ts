(*---
description: Evaluates a random seq expression, seed 262, number 5553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([[[[x \in 1..2 |-> x] EXCEPT ![1] = -1] EXCEPT ![Cardinality({1, 2})] = ([a |-> 1]).a] EXCEPT ![LET b8588 == Cardinality(SUBSET {1}) IN (b8588 :> b8588)] = (CHOOSE b8589 \in ({x \in 1..3 : x > 1} \ 2..1) : (\A b8590 \in 1..3 : FALSE))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05553 failed.
    Attempted to apply function with integer domain to the non-integer argument (2 :> 2)
---*)
