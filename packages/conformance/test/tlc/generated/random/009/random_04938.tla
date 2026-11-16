(*---
description: Evaluates a random seq expression, seed 262, number 4938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Append(SelectSeq(<<>>, LAMBDA e : e > 0), Cardinality({2, 1, 3})), CASE ({2, 1, 3} = 2) -> LET b7683 == 2 IN 7 [] OTHER -> (1 % 2), (CHOOSE b7684 \in DOMAIN (1 :> 2) : {3 : b7685 \in {1}})) \o SelectSeq(Append(<<2147483647, 3>>, CASE TRUE -> 1 [] OTHER -> -1), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04938 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    2
---*)
