(*---
description: Evaluates a random seq expression, seed 262, number 6704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(<<([x \in Nat |-> x + 1])[7], IF FALSE THEN 2 ELSE 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = CASE ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = (CHOOSE r \in [a : {}] : TRUE)) -> Head(<<-1, 7>>) [] OTHER -> Head(SelectSeq(<<>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06704 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 166 to line 14, col 193 of module random_06704
---*)
