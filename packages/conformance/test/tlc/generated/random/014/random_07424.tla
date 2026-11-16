(*---
description: Evaluates a random function expression, seed 262, number 7424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b11436 == IF TRUE THEN 3 ELSE 3 IN (CHOOSE b11437 \in Nat : TRUE), b |-> ((SUBSET {1} \cup {x \in 1..3 : x > 1}) = (0 .. 2))] EXCEPT ![Head(Append((<<1>> \o <<3, 1, 2>>), (1 \div 1)))] = ((LET b11438 == 2147483647 IN 1 \div Head(<<3, 1, 2>>)) % ([[a |-> 1] EXCEPT !.a = @ + -1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07424 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 64 to line 14, col 91 of module random_07424
---*)
