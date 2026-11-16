(*---
description: Evaluates a random bool expression, seed 262, number 6986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(SubSeq(<<3, 1, 2>>, 7, 2) = [b10699 \in {1, 2} |-> 2])) = [a |-> IF (\E b10700 \in SUBSET {1} : TRUE) THEN (0 * 2) ELSE (7 - 7), b |-> (~(TRUE \/ TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06986 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    [a |-> 0, b |-> FALSE]
---*)
