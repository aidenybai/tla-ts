(*---
description: Evaluates a random function expression, seed 262, number 2614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)) :> ([b4116 \in DOMAIN [x \in 1..2 |-> x] |-> (1 \div b4116)])[(CASE FALSE -> -1 [] OTHER -> 1 * (CHOOSE b4117 \in {2, 1, 3} : {}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 183 to line 14, col 213 of module random_02614
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 183 to line 14, col 213 of module random_02614
---*)
