(*---
description: Evaluates a random int expression, seed 262, number 7105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-{(-Len(TRUE)) : b10907 \in UNION {(-1 .. 0), {FALSE : b10908 \in {1}}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07105 failed.
    Attempted to compare integer -1 with non-integer:
    FALSE
---*)
