(*---
description: Evaluates a random int expression, seed 262, number 8867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b13731 == Head(Append(<<3, 1, 2>>, 1)) IN ((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))[(CHOOSE b13732 \in {} : TRUE)] \div (-Cardinality((0 .. 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08867 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 65 to line 14, col 106 of module random_08867
---*)
