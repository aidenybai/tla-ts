(*---
description: Evaluates a random seq expression, seed 262, number 8362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<(CHOOSE b12938 \in (2147483647 .. 2147483647) : (b12938 = 0)), Len(SelectSeq(-1, LAMBDA e : e > 0))>>, ([(7 :> 3) EXCEPT ![(2147483647 * 1)] = (2 + -1)])[(({1} \ 1..3) \cup {3, 3})], (-(-Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08362 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 84 of module random_08362
---*)
