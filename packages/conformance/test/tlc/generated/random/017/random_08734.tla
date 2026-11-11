(*---
description: Evaluates a random function expression, seed 262, number 8734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE) @@ ((1 :> 3) @@ SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) EXCEPT ![Len(([<<3, 1, 2>> EXCEPT ![1] = 3] \o <<2147483647, 7>>))] = Head(Append([<<>> EXCEPT ![1] = 1], (1 .. 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08734 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 60 of module random_08734
---*)
