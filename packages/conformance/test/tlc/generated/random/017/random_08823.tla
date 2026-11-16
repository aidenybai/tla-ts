(*---
description: Evaluates a random function expression, seed 262, number 8823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ ((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) @@ ([<<5, 6>> EXCEPT ![<<5, 6>>] = 0] @@ [[x \in 1..2 |-> x] EXCEPT ![1] = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08823 failed.
    Attempted to access tuple at a non integral index: <<5, 6>>
---*)
