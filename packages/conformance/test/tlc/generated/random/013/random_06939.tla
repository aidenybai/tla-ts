(*---
description: Evaluates a random record expression, seed 262, number 6939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(((<<1, 2>> \cap {x \in 1..3 : x > 1}) \cap (2 .. 1))), b |-> (((2..1 \cap {1}) \ {b10621 \in {1, 2} : {1, 2}}) = ({b10622 \in {} : TRUE} \ (SUBSET {1} \ {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06939 failed.
    Attempted to check set membership in a tuple value.
---*)
