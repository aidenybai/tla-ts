(*---
description: Evaluates a random set expression, seed 262, number 4348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (Head((<<3, 1, 2>> \o <<1>>)) :> (LET b6851 == 1 IN 0).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04348 failed.
    Attempted to select field "a" from a non-record value 0
    line 14, col 56 to line 14, col 78 of module random_04348
---*)
