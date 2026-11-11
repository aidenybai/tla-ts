(*---
description: Implicit and explicit substitutions may mix.
ref: "tla2sany/semantic/SubstInNode.java#addExplicitSubstitute"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE implicit_partial ----
---- MODULE I ----
CONSTANTS a, b
d == <<a, b>>
====
a == 1
M == INSTANCE I WITH b <- 2
Test == M!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
