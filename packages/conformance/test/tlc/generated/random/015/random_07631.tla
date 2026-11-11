(*---
description: Evaluates a random seq expression, seed 262, number 7631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Append(Tail(<<3, 1, 2>>), (-3)), CASE UNION {{1, 2}, {1}} -> (-2) [] OTHER -> Len({x \in 1..3 : x > 1})), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07631 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 69 to line 14, col 87 of module random_07631
---*)
