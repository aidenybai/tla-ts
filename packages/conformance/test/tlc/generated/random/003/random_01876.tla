(*---
description: Evaluates a random seq expression, seed 262, number 1876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SelectSeq(<<2147483647, 3>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(DOMAIN <<5, 6>>)], (-CASE (-3) -> (2147483647 % 7) [] OTHER -> ([a |-> 1]).a), ([a |-> (0 .. 3), b |-> (TRUE <=> FALSE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01876 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 124 to line 14, col 125 of module random_01876
---*)
