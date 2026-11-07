(*---
description: Evaluates a random seq expression, seed 262, number 7680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append((SelectSeq(<<>>, LAMBDA e : e > 0) \o (<<1>> \o {})), (CHOOSE b11822 \in (2..1 \cup Nat) : (\E b11823 \in 1..3 : FALSE))), (((1 % 0) \div (0 % -1)) + (CHOOSE b11824 \in (<<1>> \cap {1}) : (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
---*)
