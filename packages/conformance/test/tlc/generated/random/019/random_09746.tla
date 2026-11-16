(*---
description: Evaluates a random function expression, seed 262, number 9746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE \/ [a |-> 1, b |-> TRUE]) :> (CHOOSE b15133 \in {1} : TRUE)))[(-IF TRUE THEN 3 ELSE 2)] :> ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + SortSeq(<<1, 2>>, LAMBDA p, q : p < q)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09746 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a record.
    line 14, col 20 to line 14, col 49 of module random_09746
---*)
