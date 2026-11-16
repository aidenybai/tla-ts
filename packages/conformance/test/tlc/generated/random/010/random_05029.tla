(*---
description: Evaluates a random seq expression, seed 262, number 5029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([b7819 \in SubSeq(<<1>>, 3, 3) |-> (b7819 \div 2147483647)])[Cardinality(DOMAIN [x \in 1..2 |-> x])], (([[x \in 1..2 |-> x] EXCEPT ![3] = 3])[(7 \div 2147483647)] + (CHOOSE b7820 \in (1 * [a |-> 1, b |-> TRUE]) : ({} = {x \in 1..3 : x > 1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05029 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
---*)
