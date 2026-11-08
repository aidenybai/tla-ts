(*---
description: Evaluates a random record expression, seed 262, number 4704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> LET b7354 == TRUE IN 7, b |-> ({} \subseteq SUBSET {1})] :> (CASE FALSE -> 7 [] OTHER -> 1 * Head(<<>>))), b |-> (Tail((<<>> \o <<1, 2>>)) = [b7355 \in (-1 .. 1) |-> (3 + b7355)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04704 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
