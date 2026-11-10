(*---
description: Evaluates a random bool expression, seed 262, number 5808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((<<1, 0>> \in {7, 0}) /\ ((3 = -1) /\ (<<1>> = [x \in 1..2 |-> x]))) <=> ((Len(<<>>) < LET b8952 == 0 IN 1) => (\A b8953 \in UNION {<<3, 1, 2>>, {1, 2}} : (2..1 \subseteq 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05808 failed.
    Attempted to check equality of integer 7 with non-integer:
    <<1, 0>>
---*)
