(*---
description: Evaluates a random bool expression, seed 262, number 8093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + (IF (<<1>> = <<5, 6>>) THEN (0 % <<>>) ELSE (0 - 2) * Head((<<3, 1, 2>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -4]"
---*)
