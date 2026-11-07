(*---
description: Evaluates a random seq expression, seed 262, number 7083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SelectSeq(SubSeq(<<3, 1, 2>>, 7, 1), LAMBDA e : e > 0) EXCEPT ![1] = Len(Tail(<<1, 2>>))], (CHOOSE b10878 \in {(-1 % 3), ([a |-> 1, b |-> TRUE]).a} : (Len(<<>>) \in ({x \in 1..3 : x > 1} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 77 of module random_07083
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07083 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 116 to line 14, col 218 of module random_07083
---*)
