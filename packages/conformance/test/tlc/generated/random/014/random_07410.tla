(*---
description: Evaluates a random record expression, seed 262, number 7410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b11416 \in {CASE FALSE -> 2147483647 [] OTHER -> 7 : b11417 \in {b11418 : b11418 \in SUBSET {1}}} |-> (CHOOSE r \in [a : 2..1] : TRUE)], b |-> ((([a |-> 1] \ 1..3) \subseteq DOMAIN [x \in Nat |-> x + 1]) /\ ((-1 - 3) = (2147483647 \div 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07410 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 127 to line 14, col 156 of module random_07410
---*)
