(*---
description: Evaluates a random set expression, seed 262, number 3805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((7 + 2) - ([x \in Nat |-> x + 1])[7]), ((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))[IF TRUE THEN 3 ELSE 3]} \cup ({Len(<<1, 2>>), (2147483647 - 0)} \ (LET b5998 == 0 IN 3 .. Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03805 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 101 of module random_03805
---*)
