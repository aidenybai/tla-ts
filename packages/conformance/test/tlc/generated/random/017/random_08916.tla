(*---
description: Evaluates a random seq expression, seed 262, number 8916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Len(<<3, 1, 2>>) :> Head(<<3, 1, 2>>)))[(-Cardinality(TRUE))], ([[b13817 \in {1} |-> b13817] EXCEPT ![LET b13818 == 2147483647 IN 2147483647] = Cardinality({x \in 1..3 : x > 1})])[((CHOOSE b13819 \in 1..3 : TRUE) \in UNION {2..1, <<1, 2>>})]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08916 failed.
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
