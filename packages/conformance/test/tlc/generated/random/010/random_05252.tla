(*---
description: Evaluates a random bool expression, seed 262, number 5252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (CHOOSE f \in [1..2 -> {1}] : TRUE) \cup ((0 .. 2) \cup (3 .. 2))) \subseteq UNION {((FALSE => TRUE) \cap UNION {{x \in 1..3 : x > 1}, {1}}), {(7 % 1), (7 + 1)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05252 failed.
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
