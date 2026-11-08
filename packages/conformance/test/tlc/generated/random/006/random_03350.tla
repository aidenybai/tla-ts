(*---
description: Evaluates a random seq expression, seed 262, number 3350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<CASE ({2, 1, 3} \subseteq {1}) -> Append(<<>>, 3) [] OTHER -> Head(<<3, 1, 2>>), Len(SubSeq(<<1>>, 7, 2))>> EXCEPT ![1] = <<((7 + 2) + Len(<<1, 2>>)), (CHOOSE b5321 \in {2147483647, 2147483647} : (2..1 \cap {x \in 1..3 : x > 1}))>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03350 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 171 to line 14, col 246 of module random_03350
---*)
