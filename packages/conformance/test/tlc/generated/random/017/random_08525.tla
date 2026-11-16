(*---
description: Evaluates a random set expression, seed 262, number 8525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13208 \in (UNION {{b13209 \in 2..1 : FALSE}, {0, 3}} \ {b13210 \in (2 .. 2) : (<<1>> = (1 :> 2))}) : ((CASE TRUE -> b13208 [] OTHER -> 3 \div Head(<<3, 1, 2>>)) \in UNION {UNION {{x \in 1..3 : x > 1}, SUBSET {1}}, {b13211 \in Nat : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08525 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
