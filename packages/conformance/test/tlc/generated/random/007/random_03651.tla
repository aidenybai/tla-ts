(*---
description: Evaluates a random set expression, seed 262, number 3651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b5776 \in {2147483647 : b5777 \in 1..3} : ([a |-> 1] = [a |-> 1])}, (Head(<<1>>) \div LET b5778 == 3 IN 2)} \cup ({b5779 \in (\E b5780 \in SUBSET {1} : 2..1) : (b5779 < b5779)} \cup ([<<5, 6>> EXCEPT ![2147483647] = 2147483647] \cup {0, 7}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03651 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 151 to line 14, col 180 of module random_03651
---*)
