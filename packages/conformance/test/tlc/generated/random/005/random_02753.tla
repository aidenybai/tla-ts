(*---
description: Evaluates a random seq expression, seed 262, number 2753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (CHOOSE b4346 \in {1, 2} : FALSE), Len(<<3, 1, 2>>)), IF (SUBSET {1} = {1, 2}) THEN ([a |-> 1, b |-> TRUE]).a ELSE Cardinality(SUBSET {1}), ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) + (0 \div 3))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02753 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 111 of module random_02753
---*)
