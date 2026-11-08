(*---
description: Evaluates a random record expression, seed 262, number 5331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(Head(<<>>) + (-2147483647))), b |-> (((TRUE \/ TRUE) /\ (0 = 0)) \/ ((TRUE => TRUE) < CASE TRUE -> -1 [] OTHER -> 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05331 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
