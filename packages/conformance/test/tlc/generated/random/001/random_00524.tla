(*---
description: Evaluates a random bool expression, seed 262, number 524.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00524 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (0 + 1), b |-> (TRUE <=> FALSE)] EXCEPT !.a = @ + ((CHOOSE r \in [a : {}] : TRUE)).a] = [[[a |-> 7, b |-> [a |-> 1]] EXCEPT !.a = @ + IF TRUE THEN 1 ELSE 2147483647] EXCEPT !.a = @ + Head(SubSeq(<<>>, 0, 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00524 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 104 of module random_00524
---*)
