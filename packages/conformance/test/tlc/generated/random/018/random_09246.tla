(*---
description: Evaluates a random set expression, seed 262, number 9246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b14355 \in {b14356 \in (0 .. 1) : ({2, 1, 3} \cup 2..1)} |-> CASE (TRUE \/ TRUE) -> (2 - b14355) [] OTHER -> (b14355 - TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09246 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 59 to line 14, col 77 of module random_09246
---*)
