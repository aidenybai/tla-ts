(*---
description: domain applied to string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN "a\"b\\c\n")
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_string_escapes failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a string)
    line 14, col 16 to line 14, col 33 of module domain_string_escapes
---*)
