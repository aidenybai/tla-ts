(*---
description: Evaluates a random set expression, seed 262, number 1194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((SUBSET {1} \cup {x \in 1..3 : x > 1}) \cap [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) \ {b1919 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE /\ SUBSET {1})}), {b1920 \in {b1921 \in (0 .. 7) : (\E b1922 \in b1921 : FALSE)} : ((1 \in SUBSET {1}) \/ (0 \in 2..1))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01194 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    line 14, col 224 to line 14, col 228 of module random_01194
---*)
