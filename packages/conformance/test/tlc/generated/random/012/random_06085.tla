(*---
description: Evaluates a random int expression, seed 262, number 6085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = @ + (0 + 3)]).a :> Head(<<Cardinality(SUBSET {1}), (CHOOSE b9371 \in {2, 1, 3} : FALSE)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+3
    2178:0 Overflow when computing 2147483647+3
---*)
