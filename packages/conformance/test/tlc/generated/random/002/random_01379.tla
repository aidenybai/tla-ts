(*---
description: Evaluates a random seq expression, seed 262, number 1379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SelectSeq(<<0, -1>>, LAMBDA e : e > 0) \o SubSeq(SubSeq(<<>>, 0, 1), (-1 \div 7), CASE FALSE -> 7 [] OTHER -> 0)), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a, ([b2202 \in (Nat \cap {x \in 1..3 : x > 1}) |-> (TRUE <=> TRUE)])[Head(SubSeq(<<>>, -1, 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01379 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
