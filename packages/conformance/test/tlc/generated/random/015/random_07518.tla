(*---
description: Evaluates a random record expression, seed 262, number 7518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(CHOOSE b11582 \in ({1, 2} \cap 2..1) : (TRUE <=> TRUE))), b |-> ({b11583 \in DOMAIN (1 :> 2) : (~(1 :> 2))} = {b11584 \in {[x \in Nat |-> x + 1] : b11585 \in {1}} : (TRUE => FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07518 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 79 of module random_07518
---*)
