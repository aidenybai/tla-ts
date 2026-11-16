(*---
description: Evaluates a random bool expression, seed 262, number 8583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13296 \in {(CASE FALSE -> b13297 [] OTHER -> -1 \div (3 \div b13297)) : b13297 \in {Head(<<3, 1, 2>>) : b13298 \in (Nat \ 2..1)}} : ((\A b13299 \in DOMAIN <<5, 6>> : (\A b13300 \in {} : TRUE)) \/ ((~TRUE) <=> (b13296 = 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08583 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
