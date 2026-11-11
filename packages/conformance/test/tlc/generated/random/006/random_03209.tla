(*---
description: Evaluates a random record expression, seed 262, number 3209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b5098 \in {2 : b5099 \in {1, 2}} |-> Len(<<3, 1, 2>>)])[[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = Len(<<3, 1, 2>>)]], b |-> (((<<1, 2>> \o <<3, 1, 2>>) \ ({2, 1, 3} \cup Nat)) = {CASE b5100 -> 3 [] OTHER -> b5100 : b5100 \in (2..1 \cap Nat)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03209 failed.
    Attempted to check equality of integer 2 with non-integer:
    [a |-> 3]
---*)
