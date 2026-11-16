(*---
description: Evaluates a random seq expression, seed 262, number 1352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail((CHOOSE b2153 \in {1} : FALSE)), LAMBDA e : e > 0) \o <<IF (2147483647 \in 1..3) THEN IF TRUE THEN 2147483647 ELSE 0 ELSE LET b2154 == 2 IN b2154, LET b2155 == Head(<<1>>) IN IF FALSE THEN <<3, 1, 2>> ELSE b2155>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01352 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 60 of module random_01352
---*)
