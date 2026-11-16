(*---
description: Evaluates a random seq expression, seed 262, number 8099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((<<(1..3 \cap {}), LET b12507 == 3 IN b12507>> \o <<Len(<<1, 2>>), Head(<<3, 1, 2>>)>>), LET b12508 == LET b12509 == Cardinality(Nat) IN LET b12510 == 2 IN TRUE IN ((CHOOSE b12511 \in 2..1 : FALSE) \div (b12508 + 1)), ((([a |-> 1]).a \div (-1 - FALSE)) % Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08099 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 189 to line 14, col 218 of module random_08099
---*)
