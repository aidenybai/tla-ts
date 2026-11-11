(*---
description: Evaluates a random seq expression, seed 262, number 9008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((<<1, 2>> \o <<1, 2>>) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) EXCEPT ![1] = (CHOOSE b13992 \in {b13993 : b13993 \in 1..3} : (<<>> = (1 :> 2)))] \o (Tail(<<1, 2>>) \o SortSeq(Tail(<<1>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09008 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 102 to line 14, col 165 of module random_09008
---*)
