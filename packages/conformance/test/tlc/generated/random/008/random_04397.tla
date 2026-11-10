(*---
description: Evaluates a random seq expression, seed 262, number 4397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647]), LET b6917 == Cardinality({2 : b6918 \in SUBSET {1}}) IN CASE ({x \in 1..3 : x > 1} = 1..3) -> (CHOOSE b6919 \in {x \in 1..3 : x > 1} : b6917) [] OTHER -> (3 + 2)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 55 of module random_04397
    | <<2, 5>>
---*)
