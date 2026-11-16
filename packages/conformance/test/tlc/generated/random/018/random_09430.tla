(*---
description: Evaluates a random seq expression, seed 262, number 9430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-IF (2..1 < 2) THEN {b14636 : b14636 \in 1..3} ELSE (3 + 2147483647)), Len(SubSeq((<<>> \o <<1>>), (-2), (~FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09430 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    {}
---*)
