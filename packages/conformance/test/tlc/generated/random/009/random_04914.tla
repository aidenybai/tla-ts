(*---
description: Evaluates a random seq expression, seed 262, number 4914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o (<<>> \o <<1, 2>>)), ((CHOOSE r \in [a : {1}] : TRUE)).a, ([[a |-> 1] EXCEPT !.a = @ + -1]).a) \o (CHOOSE r \in [a : 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04914 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 168 to line 14, col 197 of module random_04914
---*)
