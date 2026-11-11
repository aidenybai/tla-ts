(*---
description: Evaluates a random seq expression, seed 262, number 8648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SortSeq(Append(<<3, 1, 2>>, 7), LAMBDA p, q : p < q), CASE (3 .. 3) -> Len(<<>>) [] OTHER -> CASE TRUE -> 2147483647 [] OTHER -> 0, (Cardinality({2, 1, 3}) * LET b13383 == 7 IN 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08648 failed.
    A non-boolean expression (a set of the form i..j) was used as a condition of a CASE. line 14, col 88 to line 14, col 93 of module random_08648
---*)
