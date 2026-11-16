(*---
description: Evaluates a random bool expression, seed 262, number 28.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq((<<3, 1, 2>> \o <<3, 1, 2>>), LAMBDA e : e > 0) = ({7, 3} \cup {1, 2})) => (((1..3 \ SUBSET {1}) = DOMAIN (1 :> 2)) \/ ((\E b43 \in {1} : FALSE) => (\A b44 \in {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00028 failed.
    Attempted to check equality of the function <<3, 1, 2, 3, 1, 2>> with the value:
    {1, 2, 3, 7}
---*)
