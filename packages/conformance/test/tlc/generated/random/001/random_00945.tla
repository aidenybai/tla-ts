(*---
description: Evaluates a random int expression, seed 262, number 945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1521 \in ((1..3 \cap {1}) \cap (2 .. 0)) : ((7 \div b1521) = Len(<<>>))) - IF ((\A b1522 \in {x \in 1..3 : x > 1} : TRUE) <=> (2 = 7)) THEN ((3 + -1) % (7 % 2)) ELSE ([a |-> 2, b |-> FALSE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00945 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 96 of module random_00945
---*)
