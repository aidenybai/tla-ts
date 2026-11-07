(*---
description: Evaluates a random function expression, seed 262, number 6248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9625 \in (({[a |-> 1], 0} \cup (FALSE @@ (1 :> 2))) \cup {(2 % b9626) : b9626 \in ({2, 1, 3} \cup {2, 1, 3})}) |-> Cardinality((({1, 2} \cup {2, 1, 3}) \ SubSeq(<<>>, 2, 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
