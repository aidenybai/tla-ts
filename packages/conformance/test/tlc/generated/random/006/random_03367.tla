(*---
description: Evaluates a random seq expression, seed 262, number 3367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq((Append(<<1, 2>>, <<3, 1, 2>>) \o SortSeq(<<1>>, LAMBDA p, q : p < q)), LET b5346 == CASE TRUE -> 2 [] OTHER -> 2147483647 IN (-2), ((-1 * 2) \div ([x \in 1..2 |-> x])[2147483647])), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03367 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
