(*---
description: Evaluates a random bool expression, seed 262, number 6881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10547 \in UNION {UNION {({1, 2} \cap {}), (-1 .. 2147483647)}, UNION {(2..1 \cap {x \in 1..3 : x > 1}), {2147483647 : b10548 \in 1..3}}} : (((2 + b10547) < (CHOOSE b10549 \in {x \in 1..3 : x > 1} : TRUE)) /\ (LET b10550 == 1 IN b10547 < IF TRUE THEN b10547 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06881 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
