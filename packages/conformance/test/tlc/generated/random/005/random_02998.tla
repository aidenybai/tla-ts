(*---
description: Evaluates a random set expression, seed 262, number 2998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [a |-> LET b4760 == LET b4761 == 7 IN 0 IN (TRUE \/ <<5, 6>>), b |-> (\A b4762 \in (SUBSET {1} \ {2, 1, 3}) : ({1, 2} < b4762))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02998 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
