(*---
description: + from Naturals may be applied in nonfix form.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_standard_plus ----
EXTENDS Naturals
Test == +(1, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
