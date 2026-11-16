(*---
description: Evaluates a random bool expression, seed 262, number 3925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] = [a |-> 1]) <=> (FALSE <=> TRUE)) \/ ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [a |-> 0, b |-> FALSE])) /\ (\E b6188 \in (DOMAIN <<5, 6>> \ UNION {1..3, 0}) : (<<0, 3>> = [[x \in 1..2 |-> x] EXCEPT ![b6188] = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03925 failed.
    Attempted to compare integer 0 with non-integer:
    1..3
---*)
