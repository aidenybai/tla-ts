(*---
description: Evaluates a random set expression, seed 262, number 4880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(\E b7598 \in {} : TRUE), (7 - 2147483647)} \ (UNION {{2, 1, 3}, {1}} \cap DOMAIN (1 :> 2))), {b7599 \in ((Nat \ {1, 2}) \cap {3, 2147483647}) : (UNION {Nat, SUBSET {1}} = (b7599 .. 3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04880 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
