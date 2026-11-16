(*---
description: Evaluates a random set expression, seed 262, number 7259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11166 \in ({(0 % b11167) : b11167 \in (2..1 \cup 1..3)} \cup {Len(<<1>>) : b11168 \in (-1 .. 1)}) : ((\A b11169 \in {b11170 : b11170 \in TRUE} : (TRUE => TRUE)) \/ (\E b11171 \in {1, b11166} : (~TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07259 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 155 to line 14, col 158 of module random_07259
---*)
