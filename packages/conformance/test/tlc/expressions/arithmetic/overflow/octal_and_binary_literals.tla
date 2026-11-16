(*---
description: "Octal and binary literals are integers."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: success
---*)
---- MODULE octal_and_binary_literals ----
EXTENDS Integers
Test == \o17 = 15 /\ \b101 = 5
====

(*--- recorded
all:
  exit: 0
---*)
