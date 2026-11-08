(*---
description: Evaluates a random seq expression, seed 262, number 3557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(<<CASE TRUE -> 2 [] OTHER -> 2147483647, ([a |-> 1]).a>>, (-IF TRUE THEN 7 ELSE (1 :> 2)), Cardinality({b5626 : b5626 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03557 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2, 1>>
    , but instead it is
    -7
---*)
