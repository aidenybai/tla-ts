(*---
description: Evaluates a random set expression, seed 262, number 9352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Len(<<1, 2>>) - ([a |-> 1, b |-> TRUE]).a) : b14512 \in {(b14513 + 1) : b14513 \in ([x \in Nat |-> x + 1] \cup Nat)}} \cap ({(0 - 3) : b14514 \in {b14515 \in [x \in 1..2 |-> x] : FALSE}} \cap {(b14516 + 7) : b14516 \in UNION {Nat, {2, 1, 3}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09352 failed.
    Attempted to enumerate S \cup T when S:
    [x \in Nat |-> <expression line 14, col 118 to line 14, col 122 of module random_09352>]
    and T:
    Nat
    are not both enumerable
---*)
