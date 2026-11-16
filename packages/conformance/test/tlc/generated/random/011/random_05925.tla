(*---
description: Evaluates a random record expression, seed 262, number 5925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SubSeq({1}, <<5, 6>>, -1)), b |-> ({1, -1} => (FALSE /\ [a |-> 1, b |-> TRUE]))] EXCEPT !.a = @ + Cardinality(({0 : b9134 \in {1}} \cup DOMAIN [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05925 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {1}
---*)
