(*---
description: Evaluates a random seq expression, seed 262, number 5305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + Head(<<1>>)]).a, (CHOOSE b8211 \in DOMAIN (-1 :> 2) : (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (b8211 < b8211)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05305 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 168 of module random_05305
---*)
