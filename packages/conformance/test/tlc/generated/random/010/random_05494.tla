(*---
description: Evaluates a random bool expression, seed 262, number 5494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((TRUE <=> FALSE) <=> (3 \in Nat)) <=> ((FALSE => FALSE) <=> (SUBSET {1} \subseteq 1))) <=> (((7 \div 7) = ([a |-> 1, b |-> TRUE]).a) <=> (([x \in 1..2 |-> x] = (1 :> 2)) <=> (TRUE => TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05494 failed.
    Attempted to check if the value:
    {}
    is an element of the integer 1
---*)
