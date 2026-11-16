(*---
description: Evaluates a random int expression, seed 262, number 1043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((FALSE \/ FALSE) => (Nat \subseteq {2, 1, 3})) \/ (IF TRUE THEN 2147483647 ELSE 0 \in (1..3 \cup {1}))) THEN (((CHOOSE b1674 \in {} : {1, 2}) :> LET b1675 == 2147483647 IN b1675))[[[a |-> 7, b |-> TRUE] EXCEPT !.a = Len(<<1>>)]] ELSE Len(Append(SubSeq(<<1>>, 3, 3), (0 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01043 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 160 of module random_01043
---*)
