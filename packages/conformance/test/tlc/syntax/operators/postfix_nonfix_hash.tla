(*---
description: "^#(x) applies postfix ^# in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_nonfix_hash ----
a ^# == <<a>>
Test == ^#(5) = <<5>>
====

(*--- recorded
all:
  exit: 0
---*)
