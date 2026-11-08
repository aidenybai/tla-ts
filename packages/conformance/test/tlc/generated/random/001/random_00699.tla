(*---
description: Evaluates a random seq expression, seed 262, number 699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append((SubSeq(<<1, 2>>, -1, 3) \o Tail([a |-> 1, b |-> TRUE])), (-(7 - 2147483647))), Head((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) = ([x \in 1..2 |-> x])[2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00699 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
