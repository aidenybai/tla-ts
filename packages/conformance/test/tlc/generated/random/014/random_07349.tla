(*---
description: Evaluates a random bool expression, seed 262, number 7349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b11307 \in {LET b11308 == Head({1, 2}) IN Head(<<1>>), ((7 :> -1))[(CHOOSE b11309 \in {1, 2} : FALSE)]} : (((1..3 \cup 1..3) = {b11307, -1}) \/ ((b11307 .. 3) \subseteq {2, <<3, 1, 2>>}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07349 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 88 to line 14, col 119 of module random_07349
---*)
