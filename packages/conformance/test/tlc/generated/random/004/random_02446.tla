(*---
description: Evaluates a random function expression, seed 262, number 2446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE b3859 \in (Nat \cup 2..1) : (~TRUE)) < CASE (FALSE /\ TRUE) -> ([a |-> 1]).a [] OTHER -> Cardinality(Nat)) EXCEPT ![Len(SelectSeq([<<>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0))] = Len(SortSeq(Append(<<>>, 1), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02446 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 60 of module random_02446
---*)
