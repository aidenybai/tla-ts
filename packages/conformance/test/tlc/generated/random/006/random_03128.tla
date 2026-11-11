(*---
description: Evaluates a random seq expression, seed 262, number 3128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SortSeq(Append(-1, 1), LAMBDA p, q : p < q) \o Tail([<<1, 2>> EXCEPT ![1] = 2])), (Len(SubSeq(<<>>, 2147483647, 2)) * Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1])), LET b4997 == (([a |-> 1, b |-> TRUE]).a % IF FALSE THEN 7 ELSE 0) IN IF (TRUE => FALSE) THEN (CHOOSE b4998 \in Nat : FALSE) ELSE (CHOOSE b4999 \in 1..3 : FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03128 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    -1
---*)
