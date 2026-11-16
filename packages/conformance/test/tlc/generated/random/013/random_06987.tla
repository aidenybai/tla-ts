(*---
description: Evaluates a random seq expression, seed 262, number 6987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq(<<7, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b10701 == Cardinality(2..1) IN (0 * b10701)] \o SubSeq((Tail(<<1, 2>>) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), CASE (<<1>> = [x \in Nat |-> x + 1]) -> (CHOOSE b10702 \in {x \in 1..3 : x > 1} : FALSE) [] OTHER -> (CHOOSE b10703 \in {x \in 1..3 : x > 1} : TRUE), LET b10704 == (<<5, 6>>)[1] IN (-2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06987 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
