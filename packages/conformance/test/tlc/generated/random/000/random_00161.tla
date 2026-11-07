(*---
description: Evaluates a random function expression, seed 262, number 161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b248 \in (LET b249 == (-3) IN [[a |-> 1] EXCEPT !.a = b249] .. (CHOOSE b250 \in {b251 \in SUBSET {1} : FALSE} : (FALSE \/ TRUE))) |-> (IF (2..1 = SUBSET {1}) THEN Len(<<3, 1, 2>>) ELSE Head(<<1>>) * (<<7, b248>> % DOMAIN (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00161 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 143 of module random_00161
---*)
