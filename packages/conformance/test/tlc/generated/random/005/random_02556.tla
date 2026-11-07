(*---
description: Evaluates a random set expression, seed 262, number 2556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4032 \in (CASE FALSE -> 7 [] OTHER -> 7 < (1 + 2147483647)) : ((7 .. 1) \subseteq UNION {{}, 1..3})} \ {((FALSE @@ <<5, 6>>))[([x \in 1..2 |-> x])[-1]], Len(SelectSeq(<<1>>, LAMBDA e : e > 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
