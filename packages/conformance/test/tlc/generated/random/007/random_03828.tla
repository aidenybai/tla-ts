(*---
description: Evaluates a random int expression, seed 262, number 3828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF (<<>> = <<5, 6>>) THEN CASE TRUE -> 3 [] OTHER -> 0 ELSE ([x \in 1..2 |-> x])[0]) \div LET b6034 == CASE {b6035 \in {1, 2} : TRUE} -> (0 % 3) [] OTHER -> Head(<<3, 1, 2>>) IN Cardinality((2..1 \ {2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03828 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
