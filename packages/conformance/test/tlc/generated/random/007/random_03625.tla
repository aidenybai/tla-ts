(*---
description: Evaluates a random set expression, seed 262, number 3625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ({b5727, b5727} \subseteq (TRUE \cup [x \in 1..2 |-> x])) -> ([2147483647 EXCEPT ![3] = 0])[(1 % b5727)] [] OTHER -> Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) : b5727 \in {IF (\A b5728 \in <<5, 6>> : TRUE) THEN Tail(<<>>) ELSE (-7), (-(0 * 3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03625 failed.
    TLC encountered a non-enumerable quantifier bound
    <<5, 6>>.
    line 14, col 217 to line 14, col 224 of module random_03625
---*)
