(*---
description: Evaluates a random function expression, seed 262, number 1530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2430 \in {[a |-> (-3), b |-> (FALSE /\ TRUE)] : b2431 \in UNION {({1} \ 1..3), DOMAIN [x \in 1..2 |-> x]}} |-> ([b2432 \in (2..1 \cap {}) |-> CASE FALSE -> 7 [] OTHER -> 2])[CASE {b2430 : b2433 \in {2, 1, 3}} -> (2 + {}) [] OTHER -> Cardinality({})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01530 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 197 to line 14, col 225 of module random_01530
---*)
