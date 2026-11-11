(*---
description: Evaluates a random int expression, seed 262, number 4222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(<<5, 6>> @@ (1 :> 2)) EXCEPT ![Len(<<1>>)] = (7 * 2)])[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a] + (LET b6634 == IF FALSE THEN <<3, 1, 2>> ELSE 7 IN (CHOOSE b6635 \in SUBSET {1} : TRUE) % (CHOOSE b6636 \in ({1, 2} \ 1..3) : {b6636 : b6637 \in [x \in 1..2 |-> x]}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04222 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 215 to line 14, col 287 of module random_04222
---*)
