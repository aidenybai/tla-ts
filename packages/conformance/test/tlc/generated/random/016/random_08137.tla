(*---
description: Evaluates a random bool expression, seed 262, number 8137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (({1} \cup {x \in 1..3 : x > 1}) = UNION {2..1, <<1, 2>>}) -> Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) [] OTHER -> (Head(<<1>>) - (2147483647 - 7)) = [[b12571 \in SortSeq(<<>>, LAMBDA p, q : p < q) |-> Len(<<1, 2>>)] EXCEPT ![(-(-2))] = CASE (\A b12572 \in {1, 2} : FALSE) -> {b12573 \in Nat : TRUE} [] OTHER -> (2 \div 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08137 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {}
---*)
