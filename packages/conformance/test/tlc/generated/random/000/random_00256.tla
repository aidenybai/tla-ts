(*---
description: Evaluates a random record expression, seed 262, number 256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SortSeq((<<1, 2>> \o <<1>>), LAMBDA p, q : p < q)), b |-> (\E b433 \in UNION {({x \in 1..3 : x > 1} \cup (1 :> 2)), {b434 \in {2, 1, 3} : TRUE}} : ((b433 % 1) = (3 % 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00256 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    <<2>>
    are not both enumerable
---*)
