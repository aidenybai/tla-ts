(*---
description: Evaluates a random set expression, seed 262, number 3743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (\A b5905 \in 2..1 : TRUE)) THEN (CHOOSE b5906 \in {2147483647, -1} : (-1 < 2)) ELSE ((-0) % (2 * [a |-> 1])), ((Head(<<>>) + (2 * 2147483647)) % (Len(<<>>) % Head(<<>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03743 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
