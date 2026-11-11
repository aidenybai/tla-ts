(*---
description: Evaluates a random int expression, seed 262, number 6950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (CASE 1..3 -> 2 [] OTHER -> 2147483647 \in {b10635 : b10635 \in {2, 1, 3}}) THEN ((1 % 1) + ([x \in 1..2 |-> x])[-1]) ELSE Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) * (CASE (FALSE <=> FALSE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> ([a |-> 1, b |-> TRUE]).a \div Len((<<3, 1, 2>> \o <<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06950 failed.
    A non-boolean expression (a set of the form i..j) was used as a condition of a CASE. line 14, col 26 to line 14, col 29 of module random_06950
---*)
