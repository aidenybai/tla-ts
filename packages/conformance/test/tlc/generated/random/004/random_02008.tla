(*---
description: Evaluates a random function expression, seed 262, number 2008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b3180 \in ({b3181 \in SUBSET {1} : TRUE} \cap ({x \in 1..3 : x > 1} \cap 2..1)) : (\E b3182 \in (b3180 .. 7) : (0 \in {2, 1, 3}))) :> (CHOOSE b3183 \in ({b3184 \in {x \in 1..3 : x > 1} : FALSE} \cup {b3185 \in {1} : FALSE}) : ((b3183 .. 2) \subseteq UNION {{1}, {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02008 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 153 of module random_02008
---*)
