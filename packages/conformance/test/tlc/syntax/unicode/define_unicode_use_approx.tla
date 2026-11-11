(*---
description: "A definition spelled ≈ is the meaning of \\approx."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_unicode_use_approx ----
a ≈ b == <<a, b>>
Test == (1 \approx 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
