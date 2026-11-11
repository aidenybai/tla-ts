(*---
description: Evaluates a random record expression, seed 262, number 6371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({b9794 \in {1, 2} : FALSE}), b |-> ((0 \in Nat) => [TRUE EXCEPT !.a = 7])] EXCEPT !.a = [b9795 \in (UNION {SUBSET {1}, {2, 1, 3}} \ (2..1 \cup {1})) |-> (CHOOSE b9796 \in DOMAIN [x \in 1..2 |-> x] : (\E b9797 \in 1..3 : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06371 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
