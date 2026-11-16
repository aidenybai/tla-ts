(*---
description: Evaluates a random function expression, seed 262, number 9481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14728 \in {Tail(Tail(<<1, 2>>)), (-SubSeq(<<1>>, -1, 7))} |-> (IF (<<>> = <<5, 6>>) THEN Len(<<1>>) ELSE ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) % ((b14728 \div b14728) - (b14728 - -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09481 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
