(*---
description: Evaluates a random function expression, seed 262, number 6976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10676 \in (({b10677 : b10677 \in {1}} \cap UNION {Nat, {x \in 1..3 : x > 1}}) \ {b10678 \in (1..3 \ {}) : (<<1, 2>> = (1 :> 2))}) |-> ([[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = (2147483647 % 2147483647)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06976 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
