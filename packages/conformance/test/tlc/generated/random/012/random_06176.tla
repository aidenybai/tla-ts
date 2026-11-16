(*---
description: Evaluates a random bool expression, seed 262, number 6176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([-1 EXCEPT !.a = 3]).a < Len((<<1, 2>> \o <<3, 1, 2>>))) => (\E b9502 \in UNION {({} \ {2, 1, 3}), (<<5, 6>> \cup {x \in 1..3 : x > 1})} : ([a |-> 2, b |-> FALSE] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06176 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
