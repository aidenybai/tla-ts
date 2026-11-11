(*---
description: Evaluates a random int expression, seed 262, number 1329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), (CHOOSE b2131 \in {1} : FALSE), (0 \div 2147483647)), Head(<<-1, 0>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01329 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 97 of module random_01329
---*)
