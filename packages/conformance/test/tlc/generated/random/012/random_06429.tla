(*---
description: Evaluates a random seq expression, seed 262, number 6429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Head([<<3, 1, 2>> EXCEPT ![1] = 2147483647]), ([[a |-> 1] EXCEPT !.a = @ + 2]).a>>, ((CHOOSE b9895 \in ({} \ Nat) : (TRUE => TRUE)) - ([a |-> 7, b |-> FALSE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06429 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 111 to line 14, col 154 of module random_06429
---*)
