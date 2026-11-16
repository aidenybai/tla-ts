(*---
description: Evaluates a random bool expression, seed 262, number 7362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11323 == ((1 :> 2))[3] IN (CHOOSE b11324 \in 1..3 : FALSE) .. (Tail(<<3, 1, 2>>) * (2 * 2))) \subseteq {b11325 \in (UNION {{}, 2..1} \cup ((1 :> 2) @@ {x \in 1..3 : x > 1})) : ((~TRUE) /\ (<<>> = <<5, 6>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07362 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 50 to line 14, col 79 of module random_07362
---*)
