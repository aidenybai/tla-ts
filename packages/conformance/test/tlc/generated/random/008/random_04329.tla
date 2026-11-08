(*---
description: Evaluates a random int expression, seed 262, number 4329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq([<<-1, 7>> EXCEPT ![1] = DOMAIN <<5, 6>>], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04329 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    1..2
---*)
