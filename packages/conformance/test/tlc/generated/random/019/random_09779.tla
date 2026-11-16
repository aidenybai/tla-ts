(*---
description: Evaluates a random bool expression, seed 262, number 9779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b15181 == ([a |-> 1, b |-> TRUE]).a IN CASE FALSE -> 2147483647 [] OTHER -> -1, ((7 :> 2147483647))[(CHOOSE b15182 \in {1, 2} : FALSE)]} = (((2147483647 .. 3) \cup {b15183 \in 2..1 : TRUE}) \cup {IF FALSE THEN 2147483647 ELSE 2 : b15184 \in (1..3 \cup {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09779 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 123 to line 14, col 154 of module random_09779
---*)
