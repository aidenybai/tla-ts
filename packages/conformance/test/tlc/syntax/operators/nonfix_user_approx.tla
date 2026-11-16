(*---
description: "\\approx(a, b) applies a user definition of \\approx in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_user_approx ----
a \approx b == <<a, b>>
Test == \approx(1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
