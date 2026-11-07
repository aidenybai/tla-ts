(*---
description: Evaluates a random bool expression, seed 262, number 4116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 .. -1) \subseteq UNION {SUBSET {1}, {x \in 1..3 : x > 1}}) => ((0 = FALSE) => (7 = 0))) => (((<<5, 6>>)[3] \in (1 .. 1)) => ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] = (CHOOSE r \in [a : 1..2] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04116 failed.
    Attempted to check equality of integer 0 with non-integer:
    FALSE
---*)
