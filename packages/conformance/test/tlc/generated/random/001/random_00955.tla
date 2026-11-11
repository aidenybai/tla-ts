(*---
description: Evaluates a random set expression, seed 262, number 955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\A b1540 \in (Nat \ {1}) : (FALSE => TRUE)) THEN Cardinality(({1, 2} \cup [a |-> 1, b |-> TRUE])) ELSE (([a |-> 1]).a + ((1 :> 2))[FALSE]) .. (((-1 + 0) + (0 + 1)) \div ((\E b1541 \in 2..1 : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00955 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
