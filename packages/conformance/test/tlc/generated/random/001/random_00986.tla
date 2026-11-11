(*---
description: Evaluates a random bool expression, seed 262, number 986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((<<5, 6>> \cap {1}) \cup {[x \in Nat |-> x + 1], 2}) = ({3, 0} \ ({} \cup 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00986 failed.
    Attempted to check set membership in a tuple value.
---*)
