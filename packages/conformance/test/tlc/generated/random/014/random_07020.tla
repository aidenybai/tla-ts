(*---
description: Evaluates a random bool expression, seed 262, number 7020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((Append(<<3, 1, 2>>, 0) \o Append(<<3, 1, 2>>, -1)), ([[a |-> 1] EXCEPT !.a = @ + -1]).a, (([a |-> 1, b |-> TRUE]).a + (3 % 2))) = [b10770 \in ((2 .. -1) \cap UNION {SUBSET {1}, {}}) |-> ((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE))[([x \in 1..2 |-> x])[b10770]]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07020 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2, 0, 3, 1, 2, -1>>
    , but instead it is
    0
---*)
