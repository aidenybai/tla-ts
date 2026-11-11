(*---
description: Evaluates a random int expression, seed 262, number 7153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((0 + 2) - LET b10993 == 0 IN b10993) :> (CASE FALSE -> 2147483647 [] OTHER -> 0 - (CHOOSE b10994 \in Nat : FALSE))) EXCEPT ![Cardinality({([a |-> 1]).a : b10995 \in (SUBSET {1} \ 1..3)})] = (Cardinality(({1, 2} \ {x \in 1..3 : x > 1})) - ((CHOOSE b10996 \in {1, 2} : TRUE) % ([a |-> 1, b |-> TRUE] \div 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07153 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 102 to line 14, col 130 of module random_07153
---*)
