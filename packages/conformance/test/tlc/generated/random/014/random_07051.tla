(*---
description: Evaluates a random int expression, seed 262, number 7051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b10816 \in (1..3 \cup [x \in 1..2 |-> x]) : (Nat = Nat)), b |-> ({b10817 \in <<5, 6>> : TRUE} \subseteq {0, 2147483647})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07051 failed.
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    <<1, 2>>
    are not both enumerable
---*)
