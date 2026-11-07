(*---
description: "-.(x) names prefix minus in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_standard_prefix_minus_dot ----
EXTENDS Integers
Test == -.(1) = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
