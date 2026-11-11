(*---
description: Evaluates a random record expression, seed 262, number 6948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(-([a |-> 1, b |-> FALSE]).a) EXCEPT !.a = ((CHOOSE r \in [a : 1..2] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06948 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
