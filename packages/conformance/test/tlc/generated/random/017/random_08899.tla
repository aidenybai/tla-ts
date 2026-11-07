(*---
description: Evaluates a random seq expression, seed 262, number 8899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Append(<<3, 1, 2>>, -1) \o (3 \div 7)) EXCEPT ![1] = (CHOOSE b13783 \in {3 : b13784 \in {1}} : (FALSE /\ FALSE))] \o [SortSeq(<<2147483647, 1>>, LAMBDA p, q : p < q) EXCEPT ![1] = CASE ({1} <=> TRUE) -> ([a |-> 1]).a [] OTHER -> LET b13785 == 1 IN 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    0
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    0
---*)
