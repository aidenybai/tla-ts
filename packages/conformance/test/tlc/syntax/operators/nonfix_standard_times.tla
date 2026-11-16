(*---
description: "* from Naturals may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_standard_times ----
EXTENDS Naturals
Test == *(2, 3) = 6
====

(*--- recorded
all:
  exit: 0
---*)
