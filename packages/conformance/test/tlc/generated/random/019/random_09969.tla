(*---
description: Evaluates a random set expression, seed 262, number 9969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {({2147483647, 1} \ (Nat \cup {2, 1, 3})), {b15497 \in {b15498 \in {} : TRUE} : [[a |-> 1] EXCEPT !.a = b15497]}}, (IF ({2, 1, 3} \subseteq Nat) THEN (CHOOSE b15499 \in Nat : <<1, 2>>) ELSE (7 * 2) \cap {b15500 \in DOMAIN (1 :> 2) : (TRUE <=> TRUE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09969 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 180 to line 14, col 211 of module random_09969
---*)
