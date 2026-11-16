(*---
description: Evaluates a random int expression, seed 262, number 7217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({LET b11089 == 2 IN 2147483647, ([a |-> 1] = [a |-> 1])} \cap {CASE TRUE -> b11090 [] OTHER -> 1 : b11090 \in UNION {{x \in 1..3 : x > 1}, {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07217 failed.
    Attempted to check equality of integer 1 with non-integer:
    TRUE
---*)
