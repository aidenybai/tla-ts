(*---
description: Evaluates a random function expression, seed 262, number 8158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT ![((Cardinality(Nat) - Len(2)) % ((CHOOSE b12621 \in 2..1 : TRUE) * CASE <<1, 2>> -> 7 [] OTHER -> 7))] = Head(SortSeq(<<2, 0>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08158 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
