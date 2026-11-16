(*---
description: Evaluates a random set expression, seed 262, number 4059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o SubSeq(Append(<<1>>, 2147483647), Len(<<3, 1, 2>>), (CHOOSE b6390 \in {2, 1, 3} : FALSE))), (((FALSE => FALSE) <=> SubSeq(<<1, 2>>, 2, 3)) * (([a |-> 1]).a * CASE TRUE -> 0 [] OTHER -> 7))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04059 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 144 to line 14, col 177 of module random_04059
---*)
