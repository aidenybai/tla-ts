(*---
description: Evaluates a random function expression, seed 262, number 6202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({[a |-> 1] : b9550 \in 2..1}) :> Len(SubSeq(<<1>>, 7, 0))) @@ ([b9551 \in {b9552 : b9552 \in {1, 2}} |-> (b9551 - b9551)] @@ ({2147483647 : b9553 \in <<5, 6>>} \cap DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06202 failed.
    TLC encountered a non-enumerable quantifier bound
    <<5, 6>>.
    line 14, col 180 to line 14, col 187 of module random_06202
---*)
