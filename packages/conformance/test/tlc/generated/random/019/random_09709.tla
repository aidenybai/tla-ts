(*---
description: Evaluates a random int expression, seed 262, number 9709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(SubSeq(<<1, 2>>, 3, 0), (<<5, 6>>)[1], ([a |-> 1, b |-> TRUE]).a)) \div (([[a |-> 1] EXCEPT !.a = @ + 0]).a % {CASE TRUE -> -1 [] OTHER -> b15065 : b15065 \in (Nat \ Nat)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09709 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
