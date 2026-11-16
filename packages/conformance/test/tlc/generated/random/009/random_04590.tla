(*---
description: Evaluates a random seq expression, seed 262, number 4590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq((CHOOSE b7193 \in {-1, 1} : ({1} = {})), (SubSeq(<<>>, -1, 2) = [[x \in 1..2 |-> x] EXCEPT ![2] = 0]), ([[x \in Nat |-> x + 1] EXCEPT ![-1] = 0] @@ (2 :> 2))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04590 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 34 to line 14, col 70 of module random_04590
---*)
