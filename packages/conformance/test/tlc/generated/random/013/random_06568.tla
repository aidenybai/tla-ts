(*---
description: Evaluates a random function expression, seed 262, number 6568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> 2..1] : TRUE) EXCEPT ![Head(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0))] = Len([b10089 \in {1, 0} |-> (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06568 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_06568
---*)
