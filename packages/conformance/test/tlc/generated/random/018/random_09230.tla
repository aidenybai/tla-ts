(*---
description: Evaluates a random record expression, seed 262, number 9230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head((<<1, 2>> \o <<>>)), b |-> ({<<1>>, -1} /\ (TRUE => TRUE))] EXCEPT !.a = Cardinality({b14325 \in (1..3 \cap SUBSET {1}) : (<<3, 1, 2>> = [x \in Nat |-> x + 1])})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09230 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 57 to line 14, col 85 of module random_09230
---*)
