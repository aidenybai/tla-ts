(*---
description: subseteq of string_set, a UserValue, and interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_string_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) \subseteq (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_string_set__interval failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 40 of module subseteq_string_set__interval
---*)
