(*---
description: Evaluates a random record expression, seed 262, number 544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Append(SubSeq(<<>>, 7, 3), (CHOOSE b926 \in {} : TRUE)), b |-> ((TRUE => FALSE) \/ [[x \in Nat |-> x + 1] EXCEPT ![0] = -1])] EXCEPT !.a = @ + SelectSeq(<<([x \in Nat |-> x + 1])[7], (2 - 0)>>, LAMBDA e : e > 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00544 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 52 to line 14, col 76 of module random_00544
---*)
