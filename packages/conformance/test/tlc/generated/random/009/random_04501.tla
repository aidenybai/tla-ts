(*---
description: Evaluates a random seq expression, seed 262, number 4501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append([<<2, 7>> EXCEPT ![1] = Len(<<3, 1, 2>>)], (CHOOSE b7069 \in {b7070 : b7070 \in 2..1} : (<<3, 1, 2>> = <<5, 6>>))), Tail(SortSeq([<<1>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q)), [[SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (3 \div 2147483647)] EXCEPT ![1] = (CHOOSE b7071 \in UNION {{1, 2}, {2, 1, 3}} : (FALSE => <<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04501 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 74 to line 14, col 141 of module random_04501
---*)
