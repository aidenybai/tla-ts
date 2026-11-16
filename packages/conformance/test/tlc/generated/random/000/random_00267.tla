(*---
description: Evaluates a random function expression, seed 262, number 267.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00267 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b450 \in ({b451 \in {b452 : b452 \in {1, 2}} : (SUBSET {1} => TRUE)} \cup {[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7], (0 % -1)}) |-> (((b450 :> -1) @@ (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)))[((2 - 0) * (<<5, 6>>)[7])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00267 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form SUBSET S.
    line 14, col 65 to line 14, col 82 of module random_00267
---*)
