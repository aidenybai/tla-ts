(*---
description: Evaluates a random int expression, seed 262, number 2670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[((3 * 2) \div (0 \div 3))] \div SubSeq((SelectSeq(<<1>>, LAMBDA e : e > 0) \o <<-1, 0>>), Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), CASE (<<>> = [x \in Nat |-> x + 1]) -> Len(<<1, 2>>) [] OTHER -> LET b4217 == 2 IN 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02670 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 63 of module random_02670
---*)
