(*---
description: Evaluates a random seq expression, seed 262, number 3934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SelectSeq(<<2, 3>>, LAMBDA e : e > 0)) EXCEPT ![1] = CASE (\A b6196 \in {b6197 \in Nat : TRUE} : ([a |-> 1] = [a |-> 1])) -> Append(Tail(<<1>>), Head(<<1>>)) [] OTHER -> ((FALSE - 7) - Len(<<1>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03934 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
