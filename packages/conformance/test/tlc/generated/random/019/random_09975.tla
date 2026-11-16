(*---
description: Evaluates a random record expression, seed 262, number 9975.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09975 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b15513 \in ({1, 2} \cup 2..1) : (SUBSET {1} = SUBSET {1})) % Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), b |-> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a < CASE ((1 :> 2) = 2147483647) -> (2 + 2147483647) [] OTHER -> (2147483647 + 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09975 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
