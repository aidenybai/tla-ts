(*---
description: Evaluates a random set expression, seed 262, number 2082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (LET b3313 == 1 IN -1 = (7 .. 3)) THEN (Head(<<1, 2>>) % (-1 + 1)) ELSE Cardinality(({x \in 1..3 : x > 1} \ [a |-> 1])) .. (((3 :> 7))[(2 * 7)] \div CASE (\E b3314 \in {1} : SUBSET {1}) -> Len(<<>>) [] OTHER -> Cardinality({2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02082 failed.
    Attempted to check equality of integer -1 with non-integer:
    {}
---*)
