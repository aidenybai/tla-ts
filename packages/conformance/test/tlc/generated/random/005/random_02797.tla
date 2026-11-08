(*---
description: Evaluates a random set expression, seed 262, number 2797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE), {Head(SubSeq(<<1, 2>>, -1, 2147483647)), IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (2 \div 2147483647) ELSE (0 % 3)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02797 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
