(*---
description: Evaluates a random record expression, seed 262, number 6847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b10500 == ((3 \div 0) % (-1 * 3)) IN Len(SubSeq(<<3, 1, 2>>, 7, b10500)), b |-> ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Head(<<1, 2>>)] \subseteq (DOMAIN <<5, 6>> \cap ([a |-> 1, b |-> TRUE] \cap Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06847 failed.
    2179:0 The second argument of \div is 0.
---*)
