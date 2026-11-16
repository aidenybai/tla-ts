(*---
description: Evaluates a random function expression, seed 262, number 9733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(Append(<<3, 1, 2>>, 3), LAMBDA e : e > 0)) :> (([b15107 \in {2, 1, 3} |-> 1] @@ (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)) * (((1 :> 2))[7] - (1 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09733 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 113 to line 14, col 154 of module random_09733
---*)
