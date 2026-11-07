(*---
description: Evaluates a random int expression, seed 262, number 9699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(IF (SUBSET {1} = Nat) THEN CASE TRUE -> 7 [] OTHER -> [a |-> 1] ELSE (3 * 7) \div CASE (FALSE => FALSE) -> (CHOOSE r \in [a : {2, 1, 3}] : TRUE) [] OTHER -> (-1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09699 failed.
    Attempted to check equality of the set {{}, {1}} with the value:
    Nat
---*)
