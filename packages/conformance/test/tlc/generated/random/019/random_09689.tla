(*---
description: Evaluates a random seq expression, seed 262, number 9689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(IF TRUE THEN 3 ELSE 2 % ([a |-> 1]).a), CASE (FALSE \/ FALSE) -> IF FALSE THEN 0 ELSE 3 [] OTHER -> (0 - 2147483647)>> \o (SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o <<CASE FALSE -> 1 [] OTHER -> 1, Cardinality(Nat)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
