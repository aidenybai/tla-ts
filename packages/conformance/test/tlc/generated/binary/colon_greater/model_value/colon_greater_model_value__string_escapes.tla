(*---
description: colon_greater of model_value, a ModelValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
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
---- MODULE colon_greater_model_value__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (mv :> "a\"b\\c\n")'
---*)
