(*---
description: Evaluates a random int expression, seed 262, number 1621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o (7 :> 3))) \div ((({1, 2} \cap <<3, 1, 2>>) \ ({1, 2} \ {1})) % ((CHOOSE b2586 \in {x \in 1..3 : x > 1} : TRUE) - (CHOOSE b2587 \in {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01621 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    (7 :> 3)
---*)
