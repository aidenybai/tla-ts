(*---
description: Evaluates a random seq expression, seed 262, number 6142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(Append(<<7, 3>>, (-1 * 2))), ((CHOOSE b9441 \in (2..1 \cap {}) : (<<1, 2>> = (1 :> 2))) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06142 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 54 to line 14, col 108 of module random_06142
---*)
