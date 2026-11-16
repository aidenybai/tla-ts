(*---
description: Evaluates a random int expression, seed 262, number 5371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8307 \in (((CHOOSE b8308 \in 1..3 : FALSE) + [a |-> 2147483647, b |-> FALSE]) .. (CHOOSE b8309 \in {2, 2} : (2147483647 = b8309))) : ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + LET b8310 == b8307 IN b8307] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b8307] EXCEPT !.a = @ + ([x \in Nat |-> x + 1])[b8307]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05371 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 65 of module random_05371
---*)
