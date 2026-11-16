(*---
description: Evaluates a random function expression, seed 262, number 4355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<>>, 3, 0)) * ((2147483647 % <<>>) * (-[x \in 1..2 |-> x]))) :> ([(7 :> 7) EXCEPT ![(0 - 1)] = Cardinality({})])[(CASE FALSE -> 2 [] OTHER -> -1 - ([a |-> 1]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04355 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
