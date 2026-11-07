(*---
description: Evaluates a random bool expression, seed 262, number 8978.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08978 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b13934 \in (-1 .. 0) : (~TRUE)} \cup {b13935 \in (3 .. 2147483647) : (1 \in <<1>>)}) \in {(CASE FALSE -> b13936 [] OTHER -> TRUE + ((1 :> 2))[3]) : b13936 \in {IF FALSE THEN b13937 ELSE b13937 : b13937 \in {0, 2147483647}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08978 failed.
    Attempted to check set membership in a tuple value.
---*)
