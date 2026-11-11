(*---
description: Evaluates a random set expression, seed 262, number 1231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((Append(<<3, 1, 2>>, 2) \o SubSeq(<<>>, 7, -1))) .. [(CASE TRUE -> 7 [] OTHER -> 1 :> IF TRUE THEN 7 ELSE 2) EXCEPT ![([[a |-> 1] EXCEPT !.a = @ + 2]).a] = Len(Tail(<<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01231 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
