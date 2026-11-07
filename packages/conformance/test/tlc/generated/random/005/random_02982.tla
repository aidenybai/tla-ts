(*---
description: Evaluates a random bool expression, seed 262, number 2982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<[<<5, 6>> EXCEPT ![-1] = 0], SubSeq(<<3, 1, 2>>, 0, 2147483647)>> = [(CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) EXCEPT ![(-1 \div 3)] = IF TRUE THEN -1 ELSE 7]) => (\A b4735 \in ({b4736 \in {x \in 1..3 : x > 1} : 1} \cap (Nat \cup Nat)) : ((FALSE \/ FALSE) <=> (1 < b4735)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 28 of module random_02982
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
