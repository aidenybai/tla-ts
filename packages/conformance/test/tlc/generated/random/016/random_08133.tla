(*---
description: Evaluates a random set expression, seed 262, number 8133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 < 3) => ({1} = {})) \/ (([a |-> 1] = [a |-> 1]) => {3, 7})) \/ (((TRUE \cap 2..1) \ ({1} \cap {2, 1, 3})) \subseteq {(b12563 * b12563) : b12563 \in {1, 0}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08133 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 46 to line 14, col 78 of module random_08133
---*)
