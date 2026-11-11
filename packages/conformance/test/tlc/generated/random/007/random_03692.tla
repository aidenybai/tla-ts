(*---
description: Evaluates a random bool expression, seed 262, number 3692.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03692 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~([a |-> ((1 :> 2))[2], b |-> (\A b5832 \in SUBSET {1} : TRUE)] = (CHOOSE r \in [a : 2..1] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03692 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
