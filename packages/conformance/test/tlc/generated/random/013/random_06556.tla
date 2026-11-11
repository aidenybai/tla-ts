(*---
description: Evaluates a random set expression, seed 262, number 6556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2, 3} \cup DOMAIN [x \in 1..2 |-> x]) \cap UNION {(CHOOSE r \in [a : {}] : TRUE), (FALSE /\ FALSE)}) \cup [((-1) :> (<<>> \o <<>>)) EXCEPT ![IF (FALSE <=> TRUE) THEN CASE TRUE -> -1 [] OTHER -> 2147483647 ELSE LET b10077 == 2147483647 IN b10077] = Cardinality({2147483647, 3})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06556 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 71 to line 14, col 98 of module random_06556
---*)
