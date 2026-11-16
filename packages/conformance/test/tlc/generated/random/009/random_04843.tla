(*---
description: Evaluates a random set expression, seed 262, number 4843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (-1 \in {}) THEN ([a |-> 1, b |-> TRUE]).a ELSE (0 - 1) .. ((TRUE => FALSE)).a) \ (({2147483647, 0} \ {b7559 \in {1, 2} : TRUE}) \ (DOMAIN [x \in 1..2 |-> x] \cap ({} \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04843 failed.
    Attempted to select field "a" from a non-record value FALSE
    line 14, col 80 to line 14, col 98 of module random_04843
---*)
