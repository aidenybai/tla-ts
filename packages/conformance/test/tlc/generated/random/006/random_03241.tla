(*---
description: Evaluates a random seq expression, seed 262, number 3241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(<<(<<3, 1, 2>> \o <<>>), (CHOOSE b5156 \in SUBSET {1} : FALSE)>>, LAMBDA e : e > 0) \o <<(([x \in 1..2 |-> x] * 2147483647) + (2 \div 2147483647)), Head(Tail(<<>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03241 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 53 to line 14, col 87 of module random_03241
---*)
