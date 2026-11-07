(*---
description: Evaluates a random seq expression, seed 262, number 2397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append(SubSeq(<<>>, 2, 2147483647), CASE FALSE -> 1 [] OTHER -> 1)) \o (Cardinality(UNION {Nat, {2, 1, 3}}) = (CHOOSE b3796 \in ({1} \ {1}) : (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    2
---*)
