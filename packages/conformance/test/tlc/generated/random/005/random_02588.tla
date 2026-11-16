(*---
description: Evaluates a random seq expression, seed 262, number 2588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SubSeq(SubSeq(<<3, 1, 2>>, 7, 3), (-7), Len(<<1>>)) EXCEPT ![1] = (Head(<<3, 1, 2>>) % Cardinality({}))] EXCEPT ![1] = IF ((7 = 3) /\ (\E b4077 \in Nat : FALSE)) THEN Len((<<1, 2>> \o <<1, 2>>)) ELSE IF [[a |-> 1] EXCEPT !.a = @ + 1] THEN Len(<<1, 2>>) ELSE ((1 :> 2) \div 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02588 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -7
---*)
