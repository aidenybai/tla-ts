(*---
description: Evaluates a random function expression, seed 262, number 523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b882 \in {((b883 - b883) - (3 * <<1>>)) : b883 \in UNION {UNION {1..3, 1..3}, (0 + 0)}} |-> ((-CASE FALSE -> 7 [] OTHER -> b882) \div ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b882]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00523 failed.
    Attempted to compare integer 0 with non-integer:
    {1, 2, 3}
---*)
