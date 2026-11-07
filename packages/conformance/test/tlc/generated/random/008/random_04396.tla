(*---
description: Evaluates a random bool expression, seed 262, number 4396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SubSeq([<<>> EXCEPT ![1] = 3], (2 + 1), (7 \div 1)), (-(3 \div 3))), (LET b6914 == LET b6915 == 2147483647 IN 7 IN (<<1>> = (1 :> 2)) * ((CHOOSE f \in [{1, 2} -> 1..2] : TRUE) \div LET b6916 == 2147483647 IN -1)), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = (2147483647 \div 0)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 41 of module random_04396
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    3
---*)
