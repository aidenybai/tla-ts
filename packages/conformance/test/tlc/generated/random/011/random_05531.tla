(*---
description: Evaluates a random function expression, seed 262, number 5531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq(Tail(<<3, 1, 2>>), LET b8555 == 0 IN b8555, (2 - -1))) :> (IF (\A b8556 \in [a |-> 1] : TRUE) THEN CASE TRUE -> 2 [] OTHER -> 0 ELSE (2 \div 0) + ([a |-> 2147483647, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05531 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
