(*---
description: Evaluates a random record expression, seed 262, number 9198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [[a |-> (2 - 7), b |-> ([a |-> 1, b |-> TRUE] /\ 7)] EXCEPT !.a = (-([a |-> 1]).a)], b |-> ({b14273 \in {b14274 \in {2, 1, 3} : TRUE} : (7 < b14273)} \subseteq ((2147483647 .. 3) \ UNION {{2, 1, 3}, {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09198 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a record.
    line 14, col 47 to line 14, col 72 of module random_09198
---*)
