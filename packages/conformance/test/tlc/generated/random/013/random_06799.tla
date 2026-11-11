(*---
description: Evaluates a random function expression, seed 262, number 6799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10432 \in ({(CHOOSE b10433 \in 2..1 : FALSE), (-3)} \cap [[a |-> 0, b |-> FALSE] EXCEPT !.a = @ + (3 \div 3)]) |-> Append((Head(<<1, 2>>) < (b10432 - b10432)), (Cardinality({x \in 1..3 : x > 1}) * (-b10432)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06799 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 60 of module random_06799
---*)
