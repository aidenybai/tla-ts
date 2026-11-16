(*---
description: Evaluates a random seq expression, seed 262, number 343.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00343 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append([(<<3, 1, 2>> \o <<3, 1, 2>>) EXCEPT ![1] = (CHOOSE b577 \in 2..1 : TRUE)], Len([<<3, 1, 2>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]])) EXCEPT ![1] = (IF (TRUE <=> FALSE) THEN CASE TRUE -> 2147483647 [] OTHER -> 7 ELSE [<<1>> EXCEPT ![1] = 7] - (Len(<<1>>) - (-7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00343 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 69 to line 14, col 95 of module random_00343
---*)
