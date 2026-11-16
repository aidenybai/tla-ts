(*---
description: Evaluates a random bool expression, seed 262, number 5057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 1..2] : TRUE) = [(([a |-> 1]).a :> Head(<<1>>)) EXCEPT !.a = @ + IF (2..1 = {1}) THEN Head(<<3, 1, 2>>) ELSE (0 + 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05057 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
