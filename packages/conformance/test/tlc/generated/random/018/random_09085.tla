(*---
description: Evaluates a random seq expression, seed 262, number 9085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(({} \subseteq 1..3) \/ (FALSE /\ TRUE)) EXCEPT ![1] = IF (FALSE => FALSE) THEN {7 : b14121 \in Nat} ELSE (7 + -1)] EXCEPT ![1] = Head(<<(7 * 2), (3 - 7)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09085 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
