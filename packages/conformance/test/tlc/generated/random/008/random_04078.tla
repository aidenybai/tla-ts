(*---
description: Evaluates a random set expression, seed 262, number 4078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [b6411 \in (SUBSET {1} \cup Nat) |-> ([x \in Nat |-> x + 1])[2147483647]], (Head(SubSeq(<<>>, 3, 2147483647)) \ {b6412 \in {b6413 \in {1} : TRUE} : (2147483647 \in {})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04078 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    3
---*)
