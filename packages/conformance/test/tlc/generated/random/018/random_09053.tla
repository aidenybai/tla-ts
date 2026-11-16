(*---
description: Evaluates a random seq expression, seed 262, number 9053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (FALSE).a], CASE (7 \in {x \in 1..3 : x > 1}) -> (CHOOSE b14070 \in Nat : FALSE) [] OTHER -> (CHOOSE b14071 \in {1, 2} : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 62 of module random_09053
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09053 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 172 to line 14, col 203 of module random_09053
---*)
