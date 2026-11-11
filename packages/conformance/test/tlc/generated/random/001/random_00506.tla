(*---
description: Evaluates a random seq expression, seed 262, number 506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(Append(Cardinality(1..3), (1 + 3))) EXCEPT ![1] = (CHOOSE b843 \in {Len(<<1>>) : b844 \in {b845 : b845 \in {1, 2}}} : (([a |-> 1, b |-> TRUE]).a < (CHOOSE b846 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00506 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    3
---*)
