(*---
description: Evaluates a random set expression, seed 262, number 6794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 \div 3), (0 \div 2147483647)} \cap ({b10423 \in {1, 2} : FALSE} \ DOMAIN [x \in 1..2 |-> x])) \ DOMAIN ((2 \in Nat) <=> (\A b10424 \in {} : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06794 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 118 to line 14, col 168 of module random_06794
---*)
