(*---
description: Evaluates a random seq expression, seed 262, number 8405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((<<(3 - 1), (2..1 = SUBSET {1})>> \o <<(-2147483647), (CHOOSE b13012 \in {1} : FALSE)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08405 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 109 of module random_08405
---*)
