(*---
description: Evaluates a random int expression, seed 262, number 7332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Head(Append(<<1, 2>>, <<1>>)) = ([[a |-> 1] EXCEPT !.a = 3]).a) -> CASE ((TRUE <=> FALSE) \/ (FALSE /\ TRUE)) -> (Cardinality(1..3) + Len(<<5, 6>>)) [] OTHER -> SortSeq([<<3, 1, 2>> EXCEPT ![1] = 1], LAMBDA p, q : p < q) [] OTHER -> CASE (\E b11281 \in {b11282 \in {1} : TRUE} : (TRUE <=> FALSE)) -> Len(<<3, 0>>) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 3]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)
