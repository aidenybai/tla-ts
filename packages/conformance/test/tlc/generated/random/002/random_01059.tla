(*---
description: Evaluates a random seq expression, seed 262, number 1059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(((SUBSET {1} \cap {1, 2}) \ {2 : b1696 \in {1, 2}}), LAMBDA p, q : p < q), Len([<<-1, 2147483647>> EXCEPT ![1] = CASE TRUE -> 3 [] OTHER -> 0]), ((Cardinality(SUBSET {1}) :> (CHOOSE b1697 \in {x \in 1..3 : x > 1} : FALSE)))[Head(SubSeq(<<3, 1, 2>>, 2, 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01059 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
