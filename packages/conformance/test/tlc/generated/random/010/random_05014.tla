(*---
description: Evaluates a random bool expression, seed 262, number 5014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7801 \in {(UNION {{1}, 1..3} \cup {3, -1}), (CHOOSE b7802 \in UNION {{}, 2..1} : (7 < 7))} : (((TRUE => FALSE) \/ (FALSE => TRUE)) /\ (~([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05014 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 66 to line 14, col 108 of module random_05014
---*)
