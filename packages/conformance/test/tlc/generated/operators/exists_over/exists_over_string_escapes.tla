(*---
description: exists_over applied to string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in "a\"b\\c\n" : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_string_escapes failed.
    TLC encountered a non-enumerable quantifier bound
    "a\"b\\c\n".
    line 14, col 25 to line 14, col 35 of module exists_over_string_escapes
---*)
