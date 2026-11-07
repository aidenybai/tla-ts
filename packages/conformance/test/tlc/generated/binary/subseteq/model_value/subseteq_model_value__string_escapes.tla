(*---
description: subseteq of model_value, a ModelValue, and string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE subseteq_model_value__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \subseteq ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subseteq_model_value__string_escapes failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 17, col 16 to line 17, col 43 of module subseteq_model_value__string_escapes
---*)
