(*---
description: Evaluates a random seq expression, seed 262, number 1635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SubSeq(<<>>, 1, 1)), b |-> (~({1, 2} = SUBSET {1}))] EXCEPT !.a = @ + IF (LET b2613 == 1 IN 2147483647 \in DOMAIN (1 :> 2)) THEN CASE (1..3 \subseteq 1..3) -> Cardinality({}) [] OTHER -> ((1 :> 2))[7] ELSE Len([<<3, 1, 2>> EXCEPT ![1] = 7])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
