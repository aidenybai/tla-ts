(*---
description: Evaluates a random bool expression, seed 262, number 7611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \cup 1..3) \cap UNION {{2, 1, 3}, {1}}) \cup ((-1 + -1) .. LET b11705 == 0 IN b11705)) \subseteq {b11706 \in ((FALSE => TRUE) \cup {b11707 \in {x \in 1..3 : x > 1} : FALSE}) : ((~FALSE) <=> (FALSE /\ TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07611 failed.
    Attempted to check if the value:
    -2
    is an element of the boolean TRUE
---*)
