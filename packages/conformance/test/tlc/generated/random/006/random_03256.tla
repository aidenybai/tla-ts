(*---
description: Evaluates a random seq expression, seed 262, number 3256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(Append(TRUE, -1)), ((2147483647 + -1) % (7 * 2147483647))} \cup {b5183 \in DOMAIN [(1 :> 2) EXCEPT ![-1] = 0] : (~(TRUE => TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03256 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    TRUE
---*)
