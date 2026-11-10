(*---
description: Evaluates a random bool expression, seed 262, number 6076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b9360 \in (((CHOOSE b9361 \in {} : FALSE) .. Len(<<>>)) \cup (UNION {Nat, 2..1} \ {0, 1})) : ((\E b9362 \in (2..1 \ 2..1) : ({1, 2} \subseteq 2..1)) => ((2..1 \ {x \in 1..3 : x > 1}) = (1 .. b9360)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06076 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 59 of module random_06076
---*)
