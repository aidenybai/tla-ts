(*---
description: Evaluates a random bool expression, seed 262, number 3039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((1 .. 7) \ UNION {{1}, {1, 2}}), {CASE TRUE -> 1 [] OTHER -> b4831 : b4831 \in {b4832 : b4832 \in {}}}} /\ [[[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = (CHOOSE b4833 \in 2..1 : TRUE)] EXCEPT !.a = @ + (({x \in 1..3 : x > 1} + 0) * (CHOOSE b4834 \in SUBSET {1} : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03039 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 17 to line 14, col 291 of module random_03039
---*)
