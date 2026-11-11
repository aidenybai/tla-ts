(*---
description: Evaluates a random set expression, seed 262, number 4817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b7512 \in ({b7513 \in 1..3 : TRUE} \cup (1..3 \ {2, 1, 3})) : ((FALSE => FALSE) /\ (<<>> => TRUE))} \ {LET b7514 == {b7515 \in SUBSET {1} : FALSE} IN (2 - b7514), LET b7516 == ([a |-> 1])[0] IN Head(<<3, 1, 2>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04817 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 102 to line 14, col 113 of module random_04817
---*)
