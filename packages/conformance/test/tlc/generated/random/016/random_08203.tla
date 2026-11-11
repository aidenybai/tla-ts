(*---
description: Evaluates a random record expression, seed 262, number 8203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + (CHOOSE r \in [a : {1, 2}] : TRUE)] EXCEPT !.a = (Cardinality(SUBSET {1}) \div IF FALSE THEN 1 ELSE 0)] EXCEPT !.a = @ + (Len(SubSeq(<<3, 1, 2>>, -1, -1)) + Len(Tail((1 :> 2))))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08203 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_08203
---*)
