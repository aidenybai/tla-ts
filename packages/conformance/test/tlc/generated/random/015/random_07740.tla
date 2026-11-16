(*---
description: Evaluates a random set expression, seed 262, number 7740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE (~({1} \subseteq Nat)) -> Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) [] OTHER -> ((7 + 1) % (-7)), (CHOOSE b11940 \in DOMAIN (7 :> [x \in Nat |-> x + 1]) : (SortSeq(<<1>>, LAMBDA p, q : p < q) = [b11941 \in {x \in 1..3 : x > 1} |-> -1]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07740 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -7
---*)
