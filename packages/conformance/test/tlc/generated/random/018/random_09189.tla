(*---
description: Evaluates a random record expression, seed 262, number 9189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([UNION {1..3, Nat} EXCEPT !.a = (1 - 0)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09189 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
