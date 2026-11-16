(*---
description: Evaluates a random bool expression, seed 262, number 7796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CASE FALSE -> b12023 [] OTHER -> b12023 * Len(<<3, 1, 2>>)) : b12023 \in {b12024 \in (2..1 \cap 2..1) : (b12024 \in Nat)}} \subseteq (DOMAIN (0 :> 1) \cap UNION {{b12025 \in 2..1 : TRUE}, (2147483647 .. 1)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
