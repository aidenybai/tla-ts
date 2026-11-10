(*---
description: Evaluates a random record expression, seed 262, number 461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b762 \in DOMAIN [x \in 1..2 |-> x] : (~FALSE)) % Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), b |-> (<<(2 + 7), LET b763 == 7 IN <<1>>>> = ([b764 \in {2, 1, 3} |-> 2147483647] @@ [1..3 EXCEPT ![2147483647] = 0]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00461 failed.
    Attempted to apply EXCEPT construct to the value 1..3.
---*)
