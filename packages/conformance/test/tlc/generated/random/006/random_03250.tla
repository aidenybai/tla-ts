(*---
description: Evaluates a random set expression, seed 262, number 3250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b5169 \in ({2, 1, 3} \cup {1, 2}) |-> (7 + b5169)] \cup DOMAIN [DOMAIN [x \in 1..2 |-> x] EXCEPT ![(0 - 7)] = ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03250 failed.
    Attempted to apply EXCEPT construct to the value 1..2.
---*)
