(*---
description: Evaluates a random int expression, seed 262, number 7579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((-1 % 2147483647) = (CHOOSE b11667 \in 2..1 : TRUE)) THEN Len(SubSeq(<<3, 1, 2>>, 3, 7)) ELSE Head((1 = 0)) \div ((-(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)) \div Head([<<1>> EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07579 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 42 to line 14, col 70 of module random_07579
---*)
