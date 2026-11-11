(*---
description: Evaluates a random bool expression, seed 262, number 9474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14720 \in {b14721 \in (SUBSET {1} \ SUBSET {1}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])} : ((\E b14722 \in {1} : FALSE) => (1 < 2))) \in (({b14723 \in {2, 1, 3} : FALSE} \ DOMAIN [x \in 1..2 |-> x]) \cup UNION {{-1, FALSE}, ({1} \cap Nat)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09474 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 154 of module random_09474
---*)
