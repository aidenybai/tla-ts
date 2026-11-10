(*---
description: Evaluates a random set expression, seed 262, number 7807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((b12043 :> 0) @@ [b12044 \in 2..1 |-> 0]))[IF (~TRUE) THEN (1 * b12043) ELSE CASE FALSE -> 2 [] OTHER -> b12043] : b12043 \in UNION {{b12045 \in {b12046 \in Nat : FALSE} : ({x \in 1..3 : x > 1} \subseteq Nat)}, DOMAIN (<<5, 6>> @@ (1 :> 2))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07807 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
