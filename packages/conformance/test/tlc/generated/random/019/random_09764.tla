(*---
description: Evaluates a random function expression, seed 262, number 9764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a :> LET b15162 == Cardinality(2..1) IN CASE TRUE -> 2147483647 [] OTHER -> 7) @@ SelectSeq((({x \in 1..3 : x > 1} \cap 2..1) \o Tail(<<1>>)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09764 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
---*)
