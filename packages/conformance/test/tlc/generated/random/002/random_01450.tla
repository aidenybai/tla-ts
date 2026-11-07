(*---
description: Evaluates a random set expression, seed 262, number 1450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 \div 0) .. CASE TRUE -> 3 [] OTHER -> 2147483647) \cap SortSeq(SubSeq(<<>>, -1, 3), LAMBDA p, q : p < q)) \cup DOMAIN [(7 :> {1, 2}) EXCEPT ![DOMAIN <<1, 2>>] = (3 + 7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
