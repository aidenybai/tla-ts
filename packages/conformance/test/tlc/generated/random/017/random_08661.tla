(*---
description: Evaluates a random seq expression, seed 262, number 8661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq([<<7, 3>> EXCEPT ![1] = Head(<<>>)], LAMBDA p, q : p < q), (LET b13404 == (-1 + 2147483647) IN (b13404 - -1) \div LET b13405 == Len(<<1, 2>>) IN CASE FALSE -> 2 [] OTHER -> 2), ((IF <<1, 2>> THEN -1 ELSE 1 \div ((1 :> 2))[7]) + (CASE FALSE -> (1 :> 2) [] OTHER -> 1 % (CHOOSE b13406 \in {1, 2} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08661 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
