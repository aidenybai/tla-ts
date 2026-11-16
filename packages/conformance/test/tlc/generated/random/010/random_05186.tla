(*---
description: Evaluates a random bool expression, seed 262, number 5186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), CASE (<<1>> \ SUBSET {1}) -> (<<1>> * Nat) [] OTHER -> Cardinality(Nat), Len((3 - 2..1))) = [[[a |-> -1, b |-> TRUE] EXCEPT !.a = @ + Cardinality(2..1)] EXCEPT !.a = @ + IF (0 < -1) THEN (3 + 2147483647) ELSE SubSeq(<<>>, 2, 7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05186 failed.
    A non-boolean expression (a set of the form S \ T) was used as a condition of a CASE. line 14, col 99 to line 14, col 116 of module random_05186
---*)
