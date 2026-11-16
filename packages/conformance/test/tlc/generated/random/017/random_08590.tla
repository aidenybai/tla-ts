(*---
description: Evaluates a random function expression, seed 262, number 8590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((SortSeq(<<>>, LAMBDA p, q : p < q) \o <<-1, 0>>)) :> IF (IF TRUE THEN 1 ELSE 1 \in {b13309 \in SUBSET {1} : FALSE}) THEN Len((<<1>> \o <<1, 2>>)) ELSE CASE (~FALSE) -> (2147483647 - 1) [] OTHER -> (-1 * 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08590 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 76 to line 14, col 227 of module random_08590
---*)
