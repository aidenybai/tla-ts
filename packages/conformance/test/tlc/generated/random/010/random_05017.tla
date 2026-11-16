(*---
description: Evaluates a random bool expression, seed 262, number 5017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0)), (CHOOSE b7804 \in {7 : b7805 \in SUBSET {1}} : (\A b7806 \in SUBSET {1} : FALSE))} = ({([a |-> 1]).a, (-1 \div [x \in Nat |-> x + 1])} = (({2, 1, 3} \ Nat) \ UNION {Nat, 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05017 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
