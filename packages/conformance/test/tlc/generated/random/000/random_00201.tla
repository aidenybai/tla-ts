(*---
description: Evaluates a random set expression, seed 262, number 201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE), (DOMAIN [[a |-> 1] EXCEPT !.a = 0] \cap (({1, 2} \cup {2, 1, 3}) \cup (0 % 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00201 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
