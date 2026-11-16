(*---
description: Evaluates a random set expression, seed 262, number 7045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10806 \in {([a |-> b10807, b |-> FALSE]).a : b10807 \in {(7 * 1), (-0)}} : (((<<5, 6>>).a \div ([a |-> 1, b |-> TRUE]).a) = ((-2147483647) * Len(<<>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07045 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
