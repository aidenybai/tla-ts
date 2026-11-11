(*---
description: Evaluates a random record expression, seed 262, number 9174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + CASE (IF FALSE THEN -1 ELSE 2147483647 \in (Nat \cup 1..3)) -> LET b14242 == (CHOOSE f \in [{1} -> 2..1] : TRUE) IN ((1 :> 2))[<<3, 1, 2>>] [] OTHER -> (IF TRUE THEN 2147483647 ELSE -1 + LET b14243 == 0 IN b14243)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09174 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<3, 1, 2>>
---*)
