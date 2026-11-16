(*---
description: Evaluates a random int expression, seed 262, number 5474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([Append(<<3, 1, 2>>, 2147483647) EXCEPT ![(2147483647 - 2)] = (1 - 2)])[CASE ({x \in 1..3 : x > 1} = 2..1) -> (2147483647 \div <<1, 2>>) [] OTHER -> ([a |-> 1, b |-> TRUE]).a] % Len(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 7], LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 49 of module random_05474
    | 0
---*)
