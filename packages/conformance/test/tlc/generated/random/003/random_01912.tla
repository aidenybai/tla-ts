(*---
description: Evaluates a random record expression, seed 262, number 1912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b3002 == Cardinality((Nat \cup {})) IN (LET b3003 == 7 IN -1 * (CHOOSE b3004 \in Nat : TRUE)), b |-> ((CHOOSE b3005 \in {b3006 \in {1, 2} : FALSE} : (Nat = {2, 1, 3})) = ([b3007 \in <<1>> |-> -1])[(CHOOSE b3008 \in {} : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01912 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 91 to line 14, col 117 of module random_01912
---*)
