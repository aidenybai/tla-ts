(*---
description: Evaluates a random bool expression, seed 262, number 7534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11613 == (<<5, 6>>)[-1] IN (b11613 * b11613) \in {b11614 \in (2147483647 .. 1) : (CHOOSE f \in [{} -> {1, 2}] : TRUE)}) => (((CHOOSE r \in [a : {1}] : TRUE)).a < ([a |-> 0, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07534 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
