(*---
description: apply of set_cup, a SetCupValue, and interval, a IntervalValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_set_cup__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2})[1..3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_set_cup__interval failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 16 to line 14, col 35 of module apply_set_cup__interval
---*)
