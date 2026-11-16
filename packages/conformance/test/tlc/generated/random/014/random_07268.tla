(*---
description: Evaluates a random int expression, seed 262, number 7268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11192 \in DOMAIN (FALSE => TRUE) |-> Head(<<b11192, -1>>)])[LET b11193 == (CHOOSE b11194 \in {b11195 \in {1, 2} : TRUE} : ([x \in 1..2 |-> x] \subseteq 2..1)) IN ((1..3 = {1}) => (<<>> = [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07268 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 29 to line 14, col 50 of module random_07268
---*)
