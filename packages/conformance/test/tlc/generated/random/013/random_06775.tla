(*---
description: Evaluates a random set expression, seed 262, number 6775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(<<Len(<<>>), SubSeq(<<1>>, 3, 2147483647)>>) : b10386 \in {b10387 \in (SubSeq(<<>>, 0, 2147483647) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) : (({} = {1}) \/ (b10387 \in Nat))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06775 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
