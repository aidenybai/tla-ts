(*---
description: Evaluates a random bool expression, seed 262, number 1179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1891 \in {UNION {({} \ 1..3), (1..3 \cap SUBSET {1})}, ((-1 + 7) + (CHOOSE b1892 \in SUBSET {1} : FALSE))} : (SelectSeq(<<b1891, 2147483647>>, LAMBDA e : e > 0) = (Cardinality({2, 1, 3}) :> (b1891 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01179 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
