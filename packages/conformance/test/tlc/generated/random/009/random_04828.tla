(*---
description: Evaluates a random seq expression, seed 262, number 4828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SortSeq(([a |-> 1] \o TRUE), LAMBDA p, q : p < q), ((CHOOSE b7536 \in {} : FALSE) \div (-1).a)), (((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))[([a |-> 1]).a] + (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)), Head([a |-> (2 - 2147483647), b |-> (FALSE /\ FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04828 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> 1]
---*)
