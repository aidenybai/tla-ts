(*---
description: Evaluates a random int expression, seed 262, number 3603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5684 == Len(SubSeq(SubSeq(<<1>>, -1, -1), LET b5685 == -1 IN b5685, CASE FALSE -> 2147483647 [] OTHER -> 3)) IN ((([a |-> 1, b |-> TRUE]).a * (3 % b5684)) % (-(-1 % b5684))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03603 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
