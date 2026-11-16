(*---
description: Evaluates a random int expression, seed 262, number 6982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10689 \in {((7 % b10690) \div (1 - b10690)) : b10690 \in {b10691 \in {-1 : b10692 \in {2, 1, 3}} : ({2, 1, 3} \subseteq {1, 2})}} : (\A b10693 \in {(-b10689), ([x \in Nat |-> x + 1])[b10689]} : (\E b10694 \in (1..3 \cup 2..1) : (1 = 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06982 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 261 of module random_06982
---*)
