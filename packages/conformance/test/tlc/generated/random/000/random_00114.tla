(*---
description: Evaluates a random bool expression, seed 262, number 114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Append(SubSeq(<<>>, -1, 7), (2 + 2147483647)), Len(Append(<<3, 1, 2>>, -1)), ([a |-> 2, b |-> FALSE]).a) = ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) @@ (Head(<<1>>) :> Cardinality(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -1
---*)
