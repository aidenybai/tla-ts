(*---
description: Evaluates a random seq expression, seed 262, number 483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head((SubSeq(<<1>>, 0, 3) \o SubSeq(<<3, 1, 2>>, 7, 2))), IF ((TRUE <=> FALSE) \/ (\A b794 \in SUBSET {1} : Nat)) THEN (CHOOSE b795 \in {b796 \in {} : TRUE} : (~FALSE)) ELSE Head(Tail(<<>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
