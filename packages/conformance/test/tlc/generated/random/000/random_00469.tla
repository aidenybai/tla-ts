(*---
description: Evaluates a random function expression, seed 262, number 469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE) @@ [b774 \in {([a |-> 1, b |-> TRUE]).a : b775 \in (1..3 \cap {1, 2})} |-> ({{x \in 1..3 : x > 1}, 7} = (SUBSET {1} \ <<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00469 failed.
    Attempted to check set membership in a tuple value.
---*)
