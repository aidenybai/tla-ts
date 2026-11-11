(*---
description: Evaluates a random int expression, seed 262, number 4407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6934 == (CHOOSE b6935 \in ((Nat \ 1..3) \cup ({x \in 1..3 : x > 1} \cap {2, 1, 3})) : ((\A b6936 \in {2, 1, 3} : FALSE) => (b6935 \in 3))) IN (((b6934 + 2) + (CHOOSE b6937 \in {} : TRUE)) * ((7 :> b6934))[(<<1, 2>>)[b6934]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04407 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
