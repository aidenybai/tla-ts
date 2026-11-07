(*---
description: Evaluates a random seq expression, seed 262, number 5375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(((2..1 \ (1 :> 2)) \ (Nat \cap 1..3))), Len(<<(~TRUE), ([x \in 1..2 |-> x])[3]>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05375 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
