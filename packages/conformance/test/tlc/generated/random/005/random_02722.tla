(*---
description: Evaluates a random int expression, seed 262, number 2722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE)) -> Head(Append(Append(<<1>>, 2), ([a |-> 1]).a)) [] OTHER -> Head((SubSeq(<<>>, 3, 3) \o [<<>> EXCEPT ![1] = {x \in 1..3 : x > 1}])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02722 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 23 to line 14, col 52 of module random_02722
---*)
