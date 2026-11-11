(*---
description: Evaluates a random function expression, seed 262, number 7091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + (CHOOSE b10889 \in {b10890 \in {b10891 \in {1, 2} : [x \in Nat |-> x + 1]} : ([a |-> 1] = 1..3)} : (({1, 2} \subseteq {2, 1, 3}) => (FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07091 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a function of the form  [x \in S |-> expr].
    line 14, col 130 to line 14, col 150 of module random_07091
---*)
