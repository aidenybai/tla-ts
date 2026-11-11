(*---
description: Evaluates a random record expression, seed 262, number 8853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (LET b13716 == (-1 - 7) IN IF FALSE THEN b13716 ELSE b13716 + CASE (7 < 2) -> (0 - -1) [] OTHER -> Head(<<>>)), b |-> (~(~(FALSE <=> FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08853 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
