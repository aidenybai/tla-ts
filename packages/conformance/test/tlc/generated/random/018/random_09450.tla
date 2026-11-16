(*---
description: Evaluates a random seq expression, seed 262, number 9450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SelectSeq((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE), LAMBDA e : e > 0) EXCEPT ![1] = ((CHOOSE r \in [a : 1..2] : TRUE)).a], Head(SubSeq(SubSeq(<<3, 1, 2>>, -1, TRUE), Len(<<1>>), (CHOOSE b14666 \in {x \in 1..3 : x > 1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09450 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 35 to line 14, col 73 of module random_09450
---*)
