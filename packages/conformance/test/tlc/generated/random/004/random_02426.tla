(*---
description: Evaluates a random function expression, seed 262, number 2426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Head(Nat) :> ([a |-> 1, b |-> TRUE]).a) @@ [b3830 \in ({x \in 1..3 : x > 1} \cup 1..3) |-> Cardinality({x \in 1..3 : x > 1})]) EXCEPT ![([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = (CHOOSE b3831 \in {2, 1, 3} : b3831)]).a] = LET b3832 == (([a |-> 1, b |-> TRUE] + 0) + (<<5, 6>> - 2)) IN (([x \in Nat |-> x + 1])[b3832] - {<<1, 2>>, FALSE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    Nat
    2283:0 The argument of Head should be a sequence, but instead it is:
    Nat
---*)
