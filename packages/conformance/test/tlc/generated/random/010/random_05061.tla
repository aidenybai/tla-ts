(*---
description: Evaluates a random seq expression, seed 262, number 5061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<IF (2 \div 1) THEN Head(<<3, 1, 2>>) ELSE (1 + 2), LET b7872 == (-1 \div 1) IN [<<5, 6>> EXCEPT ![b7872] = -1]>> EXCEPT ![1] = (Len(LET b7873 == 3 IN b7873) * Cardinality(({1} \cup {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05061 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 19 to line 14, col 67 of module random_05061
---*)
