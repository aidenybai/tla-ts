(*---
description: "\\o from Sequences may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_standard_concat ----
EXTENDS Sequences
Test == \o(<<1>>, <<2>>) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
