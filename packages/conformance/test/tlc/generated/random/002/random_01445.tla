(*---
description: Evaluates a random function expression, seed 262, number 1445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append(<<-1, 0>>, IF TRUE THEN 7 ELSE 2147483647), Len(SubSeq(<<5, 6>>, -1, 2147483647))) :> ([a |-> (2 % 1), b |-> (TRUE <=> TRUE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01445 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 6>>
    , but instead it is
    -1
---*)
