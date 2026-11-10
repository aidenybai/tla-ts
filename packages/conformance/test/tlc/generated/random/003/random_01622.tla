(*---
description: Evaluates a random seq expression, seed 262, number 1622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([Tail(Append(<<1>>, 0)) EXCEPT ![1] = ([<<1, 2>> EXCEPT ![1] = 2] \o [<<3, 1, 2>> EXCEPT ![1] = 3])], ((CHOOSE r \in [a : 2..1] : TRUE)).a, Head(SelectSeq(Append(<<>>, 7), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01622 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 127 to line 14, col 156 of module random_01622
---*)
