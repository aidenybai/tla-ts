(*---
description: Evaluates a random set expression, seed 262, number 3654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {DOMAIN ([a |-> 1, b |-> TRUE] :> 7), ({b5781 \in {} : TRUE} \cup (<<5, 6>> \cup {2, 1, 3}))}, (((0 % 7) .. LET b5782 == 7 IN 1) \cup DOMAIN [[x \in 1..2 |-> x] EXCEPT ![[a |-> 1, b |-> TRUE]] = 3])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03654 failed.
    Attempted to apply function with integer domain to the non-integer argument [a |-> 1, b |-> TRUE]
---*)
