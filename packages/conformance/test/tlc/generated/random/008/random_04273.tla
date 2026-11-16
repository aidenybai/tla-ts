(*---
description: Evaluates a random set expression, seed 262, number 4273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (<<5, 6>> @@ <<5, 6>>) = ((Nat \cup {1, 2}) \cap {0, 7})) \cap ({b6729 \in {0, -1} : (TRUE /\ TRUE)} \cap UNION {{2147483647, 7}, UNION {1..3, SUBSET {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04273 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
