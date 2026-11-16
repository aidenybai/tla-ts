(*---
description: Evaluates a random function expression, seed 262, number 7845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12121 \in (((CHOOSE b12122 \in {2, 1, 3} : FALSE) \div (7 - 0)) .. ((CHOOSE r \in [a : {}] : TRUE)).a) |-> Head(SelectSeq(SubSeq(<<3, 1, 2>>, b12121, -1), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07845 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 65 of module random_07845
---*)
